-- ============================================================================
-- 000_baseline_schema.sql
--
-- 새로 만든 빈 DB 에 앱 테이블 9개를 만든다 (데이터 없음).
-- 2026-10-10 부터 TypeORM synchronize 를 끄면서(TODO D1) 빈 DB 에 테이블이 자동으로 생기지 않게 되어 추가했다.
-- 로컬 fit_hair 의 구조를 pg_dump --schema-only 로 뜬 것이고, 운영 fit_hair 의 앱 테이블 구조와 같다
-- (INFRA-MIGRATION B2 에서 컬럼 · 제약 · 인덱스 비교).
--
-- 사용: 빈 DB 에 한 번만. 이미 테이블이 있는 DB(운영 · 기존 로컬)에는 실행하지 않는다.
--   psql -d fit_hair -f migrations/000_baseline_schema.sql
-- 001~004 는 이 안에 이미 반영되어 있다. 005 는 이 파일로 만든 빈 DB 에는 필요 없다(시드가 새 키로 들어간다).
-- 엔티티를 바꾸면 이 파일이 아니라 새 번호의 마이그레이션 SQL 을 추가한다.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6 (Postgres.app)
-- Dumped by pg_dump version 17.6 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consultation_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultation_shares (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    token character varying(64) NOT NULL,
    consultation_id character varying(50) NOT NULL,
    password_hash character varying NOT NULL,
    password_plain character varying,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consultations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultations (
    id character varying(50) NOT NULL,
    user_id uuid,
    customer_id uuid,
    visit_date character varying(20) NOT NULL,
    designer_name character varying(100),
    after_note text,
    client_info jsonb NOT NULL,
    today_keyword jsonb DEFAULT '{}'::jsonb NOT NULL,
    fashion_style jsonb DEFAULT '{}'::jsonb NOT NULL,
    face_image_type jsonb DEFAULT '{}'::jsonb NOT NULL,
    hair_condition jsonb DEFAULT '{}'::jsonb NOT NULL,
    hair_style_proposal jsonb DEFAULT '{}'::jsonb NOT NULL,
    today_design jsonb DEFAULT '{}'::jsonb NOT NULL,
    next_direction jsonb DEFAULT '{}'::jsonb NOT NULL,
    design_cycle_guide jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    phone character varying(20),
    gender character varying(10),
    age_group character varying(20),
    memo text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: face_analysis_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.face_analysis_results (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    customer_id uuid,
    detection_type character varying(10) NOT NULL,
    face_image_url character varying(1000) NOT NULL,
    python_analysis_result jsonb NOT NULL,
    client_provided_data jsonb,
    detected_at timestamp without time zone DEFAULT now() NOT NULL,
    source character varying(20) DEFAULT 'consultation'::character varying NOT NULL
);


--
-- Name: feature_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feature_settings (
    id integer DEFAULT 1 NOT NULL,
    fit_enabled boolean DEFAULT true NOT NULL,
    three_way_enabled boolean DEFAULT true NOT NULL,
    course_1way_enabled boolean DEFAULT true NOT NULL,
    course_2way_personal_enabled boolean DEFAULT true NOT NULL,
    course_2way_skeleton_enabled boolean DEFAULT true NOT NULL,
    course_3way_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: module_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_configs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    axis character varying(4) NOT NULL,
    module_key character varying(10) NOT NULL,
    label character varying(100) NOT NULL,
    sort_order integer DEFAULT 999 NOT NULL,
    display boolean DEFAULT true NOT NULL,
    unit character varying(20),
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: pre_surveys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_surveys (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    token character varying(64) NOT NULL,
    answers jsonb DEFAULT '{}'::jsonb NOT NULL,
    filled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(100) NOT NULL,
    store_name character varying(100) DEFAULT ''::character varying NOT NULL,
    owner_name character varying(100) DEFAULT ''::character varying NOT NULL,
    password_hash character varying NOT NULL,
    phone character varying(20),
    status character varying DEFAULT 'approved'::character varying NOT NULL,
    role character varying DEFAULT 'user'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: consultation_shares PK_103938f0929fa07fa2af792bde1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_shares
    ADD CONSTRAINT "PK_103938f0929fa07fa2af792bde1" PRIMARY KEY (id);


--
-- Name: customers PK_133ec679a801fab5e070f73d3ea; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY (id);


--
-- Name: pre_surveys PK_15172f075ddafac71c9c74c93f0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_surveys
    ADD CONSTRAINT "PK_15172f075ddafac71c9c74c93f0" PRIMARY KEY (id);


--
-- Name: feature_settings PK_26b9ecee13c6f3e447002b96ad3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_settings
    ADD CONSTRAINT "PK_26b9ecee13c6f3e447002b96ad3" PRIMARY KEY (id);


--
-- Name: module_configs PK_4ffb3f6d2f4073bf1f323d6c695; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_configs
    ADD CONSTRAINT "PK_4ffb3f6d2f4073bf1f323d6c695" PRIMARY KEY (id);


--
-- Name: admin_accounts PK_79fb3604ed15538685183d8df5f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT "PK_79fb3604ed15538685183d8df5f" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: face_analysis_results PK_bc990a0dca2a53e4973e318499f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_analysis_results
    ADD CONSTRAINT "PK_bc990a0dca2a53e4973e318499f" PRIMARY KEY (id);


--
-- Name: consultations PK_c5b78e9424d9bc68464f6a12103; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT "PK_c5b78e9424d9bc68464f6a12103" PRIMARY KEY (id);


--
-- Name: admin_accounts UQ_05a0a0da9626f51206e41eda9df; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT "UQ_05a0a0da9626f51206e41eda9df" UNIQUE (email);


--
-- Name: consultation_shares UQ_0e6bd78f69cd9d352f065d95688; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_shares
    ADD CONSTRAINT "UQ_0e6bd78f69cd9d352f065d95688" UNIQUE (token);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: module_configs uq_module_configs_axis_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_configs
    ADD CONSTRAINT uq_module_configs_axis_key UNIQUE (axis, module_key);


--
-- Name: IDX_8b8d4964378f6ad633fcac5a1c; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_8b8d4964378f6ad633fcac5a1c" ON public.pre_surveys USING btree (token);


--
-- Name: IDX_b509703683d48423c202343239; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_b509703683d48423c202343239" ON public.customers USING btree (user_id, phone) WHERE (phone IS NOT NULL);


--
-- Name: customers FK_11d81cd7be87b6f8865b0cf7661; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "FK_11d81cd7be87b6f8865b0cf7661" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: face_analysis_results FK_63ad9c9984cc81124f83f3d416d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_analysis_results
    ADD CONSTRAINT "FK_63ad9c9984cc81124f83f3d416d" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: consultations FK_6b75097e3923dafb9362242037a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT "FK_6b75097e3923dafb9362242037a" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pre_surveys FK_7be0f95c62210936682d093b6e2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_surveys
    ADD CONSTRAINT "FK_7be0f95c62210936682d093b6e2" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: face_analysis_results FK_91657eb096eed3bc5eaf3a9387b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.face_analysis_results
    ADD CONSTRAINT "FK_91657eb096eed3bc5eaf3a9387b" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: consultation_shares FK_a2719ca7c092dbbed6a79ec1a83; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultation_shares
    ADD CONSTRAINT "FK_a2719ca7c092dbbed6a79ec1a83" FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE;


--
-- Name: pre_surveys FK_c2209548323e34d024591e243d0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_surveys
    ADD CONSTRAINT "FK_c2209548323e34d024591e243d0" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: consultations FK_db81d75bf1562252706802ca840; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultations
    ADD CONSTRAINT "FK_db81d75bf1562252706802ca840" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


