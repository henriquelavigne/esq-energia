-- ============================================================
-- ESQ ENERGIA — Schema completo
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL,
    papel       TEXT NOT NULL CHECK (papel IN ('admin', 'gerador', 'consumidor')),
    criado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usinas (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome            TEXT NOT NULL,
    potencia_kwp    NUMERIC(10, 2) NOT NULL,
    concessionaria  TEXT NOT NULL,
    proprietario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    criado_em       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.unidades_consumidoras (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_uc           TEXT NOT NULL UNIQUE,
    endereco            TEXT NOT NULL,
    consumo_medio_kwh   NUMERIC(10, 2),
    usina_id            UUID NOT NULL REFERENCES public.usinas(id) ON DELETE RESTRICT,
    proprietario_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    criado_em           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alocacao_creditos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usina_id    UUID NOT NULL REFERENCES public.usinas(id) ON DELETE CASCADE,
    uc_id       UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
    percentual  NUMERIC(5, 2) NOT NULL CHECK (percentual > 0 AND percentual <= 100),
    ativo       BOOLEAN DEFAULT TRUE,
    criado_em   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (usina_id, uc_id)
);

CREATE TABLE IF NOT EXISTS public.medicoes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usina_id        UUID NOT NULL REFERENCES public.usinas(id) ON DELETE CASCADE,
    mes_ano         DATE NOT NULL,
    geracao_kwh     NUMERIC(12, 2) NOT NULL,
    fonte           TEXT DEFAULT 'manual',
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (usina_id, mes_ano)
);

CREATE TABLE IF NOT EXISTS public.faturas (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uc_id                    UUID NOT NULL REFERENCES public.unidades_consumidoras(id) ON DELETE CASCADE,
    usina_id                 UUID NOT NULL REFERENCES public.usinas(id) ON DELETE CASCADE,
    mes_ano                  DATE NOT NULL,
    consumo_kwh              NUMERIC(12, 2) DEFAULT 0,
    creditos_injetados_kwh   NUMERIC(12, 2) DEFAULT 0,
    creditos_compensados_kwh NUMERIC(12, 2) DEFAULT 0,
    saldo_acumulado_kwh      NUMERIC(12, 2) DEFAULT 0,
    gerado_em                TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (uc_id, mes_ano)
);

-- ============================================================
-- TRIGGER: validação de soma de percentuais
-- ============================================================

CREATE OR REPLACE FUNCTION check_soma_percentual()
RETURNS TRIGGER AS $$
DECLARE soma NUMERIC;
BEGIN
    SELECT COALESCE(SUM(percentual), 0) INTO soma
    FROM public.alocacao_creditos
    WHERE usina_id = NEW.usina_id AND ativo = TRUE
      AND id IS DISTINCT FROM NEW.id;

    IF (soma + NEW.percentual) > 100 THEN
        RAISE EXCEPTION 'Soma dos percentuais excederia 100%%. Atual: %, tentando adicionar: %', soma, NEW.percentual;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_soma_percentual ON public.alocacao_creditos;
CREATE TRIGGER trg_check_soma_percentual
    BEFORE INSERT OR UPDATE ON public.alocacao_creditos
    FOR EACH ROW EXECUTE FUNCTION check_soma_percentual();

-- ============================================================
-- TRIGGER: criar profile automaticamente ao criar usuário
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, papel)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'papel', 'consumidor')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNÇÃO: calcular rateio mensal
-- ============================================================

CREATE OR REPLACE FUNCTION calcular_rateio_mensal(
    p_usina_id  UUID,
    p_mes_ano   DATE
)
RETURNS TEXT AS $$
DECLARE
    v_geracao_total     NUMERIC;
    v_alocacao          RECORD;
    v_creditos_uc       NUMERIC;
    v_saldo_anterior    NUMERIC;
    v_consumo_uc        NUMERIC;
    v_compensados       NUMERIC;
    v_saldo_novo        NUMERIC;
    v_count             INTEGER := 0;
BEGIN
    SELECT geracao_kwh INTO v_geracao_total
    FROM public.medicoes
    WHERE usina_id = p_usina_id AND mes_ano = DATE_TRUNC('month', p_mes_ano);

    IF NOT FOUND OR v_geracao_total IS NULL THEN
        RETURN 'ERRO: Nenhuma medição encontrada para a usina ' || p_usina_id || ' no mês ' || p_mes_ano;
    END IF;

    FOR v_alocacao IN
        SELECT ac.uc_id, ac.percentual, uc.consumo_medio_kwh
        FROM public.alocacao_creditos ac
        JOIN public.unidades_consumidoras uc ON uc.id = ac.uc_id
        WHERE ac.usina_id = p_usina_id AND ac.ativo = TRUE
    LOOP
        v_creditos_uc := ROUND((v_geracao_total * v_alocacao.percentual / 100.0), 2);
        v_consumo_uc  := COALESCE(v_alocacao.consumo_medio_kwh, 0);

        SELECT COALESCE(saldo_acumulado_kwh, 0) INTO v_saldo_anterior
        FROM public.faturas
        WHERE uc_id = v_alocacao.uc_id
          AND mes_ano = DATE_TRUNC('month', p_mes_ano) - INTERVAL '1 month';

        IF NOT FOUND THEN v_saldo_anterior := 0; END IF;

        v_compensados := LEAST(v_consumo_uc, v_creditos_uc + v_saldo_anterior);
        v_saldo_novo  := (v_creditos_uc + v_saldo_anterior) - v_compensados;

        INSERT INTO public.faturas (
            uc_id, usina_id, mes_ano, consumo_kwh,
            creditos_injetados_kwh, creditos_compensados_kwh, saldo_acumulado_kwh
        ) VALUES (
            v_alocacao.uc_id, p_usina_id, DATE_TRUNC('month', p_mes_ano),
            v_consumo_uc, v_creditos_uc, v_compensados, v_saldo_novo
        )
        ON CONFLICT (uc_id, mes_ano) DO UPDATE SET
            creditos_injetados_kwh   = EXCLUDED.creditos_injetados_kwh,
            creditos_compensados_kwh = EXCLUDED.creditos_compensados_kwh,
            saldo_acumulado_kwh      = EXCLUDED.saldo_acumulado_kwh,
            gerado_em                = NOW();

        v_count := v_count + 1;
    END LOOP;

    RETURN 'OK: Rateio calculado para ' || v_count || ' UC(s). Geração: ' || v_geracao_total || ' kWh.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usinas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_consumidoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alocacao_creditos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicoes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas               ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_papel()
RETURNS TEXT AS $$
    SELECT papel FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- profiles
DROP POLICY IF EXISTS "admin_tudo_profiles"   ON public.profiles;
DROP POLICY IF EXISTS "ver_proprio_profile"   ON public.profiles;
CREATE POLICY "admin_tudo_profiles"  ON public.profiles FOR ALL TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "ver_proprio_profile"  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

-- usinas
DROP POLICY IF EXISTS "admin_tudo_usinas"           ON public.usinas;
DROP POLICY IF EXISTS "gerador_ver_suas_usinas"      ON public.usinas;
CREATE POLICY "admin_tudo_usinas"         ON public.usinas FOR ALL    TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "gerador_ver_suas_usinas"   ON public.usinas FOR SELECT TO authenticated USING (get_papel() = 'gerador' AND proprietario_id = auth.uid());

-- unidades_consumidoras
DROP POLICY IF EXISTS "admin_tudo_ucs"            ON public.unidades_consumidoras;
DROP POLICY IF EXISTS "gerador_ver_ucs"           ON public.unidades_consumidoras;
DROP POLICY IF EXISTS "consumidor_ver_propria_uc" ON public.unidades_consumidoras;
CREATE POLICY "admin_tudo_ucs"            ON public.unidades_consumidoras FOR ALL    TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "gerador_ver_ucs"           ON public.unidades_consumidoras FOR SELECT TO authenticated USING (get_papel() = 'gerador' AND usina_id IN (SELECT id FROM public.usinas WHERE proprietario_id = auth.uid()));
CREATE POLICY "consumidor_ver_propria_uc" ON public.unidades_consumidoras FOR SELECT TO authenticated USING (get_papel() = 'consumidor' AND proprietario_id = auth.uid());

-- alocacao_creditos
DROP POLICY IF EXISTS "admin_tudo_alocacao"   ON public.alocacao_creditos;
DROP POLICY IF EXISTS "gerador_ver_alocacoes" ON public.alocacao_creditos;
CREATE POLICY "admin_tudo_alocacao"    ON public.alocacao_creditos FOR ALL    TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "gerador_ver_alocacoes"  ON public.alocacao_creditos FOR SELECT TO authenticated USING (get_papel() = 'gerador' AND usina_id IN (SELECT id FROM public.usinas WHERE proprietario_id = auth.uid()));

-- medicoes
DROP POLICY IF EXISTS "admin_tudo_medicoes"  ON public.medicoes;
DROP POLICY IF EXISTS "gerador_ver_medicoes" ON public.medicoes;
CREATE POLICY "admin_tudo_medicoes"   ON public.medicoes FOR ALL    TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "gerador_ver_medicoes"  ON public.medicoes FOR SELECT TO authenticated USING (get_papel() = 'gerador' AND usina_id IN (SELECT id FROM public.usinas WHERE proprietario_id = auth.uid()));

-- faturas
DROP POLICY IF EXISTS "admin_tudo_faturas"             ON public.faturas;
DROP POLICY IF EXISTS "gerador_ver_faturas_usina"      ON public.faturas;
DROP POLICY IF EXISTS "consumidor_ver_proprias_faturas" ON public.faturas;
CREATE POLICY "admin_tudo_faturas"              ON public.faturas FOR ALL    TO authenticated USING (get_papel() = 'admin');
CREATE POLICY "gerador_ver_faturas_usina"       ON public.faturas FOR SELECT TO authenticated USING (get_papel() = 'gerador' AND usina_id IN (SELECT id FROM public.usinas WHERE proprietario_id = auth.uid()));
CREATE POLICY "consumidor_ver_proprias_faturas" ON public.faturas FOR SELECT TO authenticated USING (get_papel() = 'consumidor' AND uc_id IN (SELECT id FROM public.unidades_consumidoras WHERE proprietario_id = auth.uid()));
