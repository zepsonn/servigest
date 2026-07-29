-- ============================================================
-- ServiGest - carga do catalogo de pecas no estoque
-- Gerado a partir de estoque-produtos.pdf (54 itens)
--
-- SEGURO: nao apaga nada, nao altera quantidade nem preco do
-- que ja existe. So acrescenta produtos novos e preenche o SKU
-- dos que ja estao cadastrados.
-- Rode um passo de cada vez e confira o resultado.
-- ============================================================


-- ------------------------------------------------------------
-- PASSO 0 - Diagnostico (nao altera nada). Rode e olhe o resultado.
-- ------------------------------------------------------------
select count(*) as produtos_ja_cadastrados from produtos;


-- ------------------------------------------------------------
-- PASSO 1 - Colunas novas (sku e categoria). Nao mexe nos dados.
-- ------------------------------------------------------------
alter table produtos add column if not exists sku text;
alter table produtos add column if not exists categoria text;


-- ------------------------------------------------------------
-- PASSO 2 - Nos produtos que VOCE JA TEM, preenche o SKU e a
-- categoria casando pelo codigo do fornecedor.
-- Quantidade e precos NAO sao tocados.
-- ------------------------------------------------------------
with cat(sku, codigo, nome, categoria) as (
  values
    ('SKU-CAR-001', 'GAS-MAPP-400', 'Cartucho Gas Mapp Hulter 400gr (ONU1077 Classe 2.1 Propileno)', 'Gases/Solda'),
    ('SKU-FLU-001', '10461', 'Fluido Refrigerante Pro134 300G', 'Gases'),
    ('SKU-FLU-002', '10462', 'Fluido Refrigerante Pro134 6Kg', 'Gases'),
    ('SKU-GAS-001', '2342', 'Gas Geladeira/Ar Condicionado R134a R134 750g', 'Gases'),
    ('SKU-FLU-003', '100273961', 'Fluido Ref R600A Isobutano Lata 420G Hulter', 'Gases'),
    ('SKU-FLU-004', 'R404A-600', 'Fluido Ref R404A 600G com Valvula Hulter (ONU3337)', 'Gases'),
    ('SKU-ELE-001', '100291669', 'Eletrobomba DR Univ S/Copo Proteg Fio Fusivel 127V Emicol', 'Motores/Bombas'),
    ('SKU-ELE-002', '1861', 'Eletrobomba Lavadora Universal 127V', 'Motores/Bombas'),
    ('SKU-MOT-001', '10550', 'Motor Compressor Geladeira Electrolux A30651901 EL80H 1/4 R134a DM84X DC45 DC47A DC47 DC47G DC49A DCW50 127v', 'Motores/Compressores'),
    ('SKU-MOT-002', '5173', 'Motor Compressor Geladeira 1/4+ EMR80HLR R134 127v Embraco', 'Motores/Compressores'),
    ('SKU-UNI-001', 'UCP4190', 'Unidade Compressora 1.1/4 HP 220V-1 R404 C/TQ Compacta', 'Motores/Compressores'),
    ('SKU-MOT-003', '3059', 'Motor Prato Microondas Fischer Tyj50-8 49tyj 127v', 'Motores'),
    ('SKU-MOT-004', '2938', 'Motor 1/25 Exaustor Freezer Balcao 110/220 Helice Aluminio 25cm', 'Motores'),
    ('SKU-MOT-005', '2943', 'Motor 1/40 Exaustor Freezer Balcao 110/220 Bucha Plastico Helice Plastico 20cm', 'Motores'),
    ('SKU-MOT-006', '9634', 'Motor Ventilador Geladeira Brastemp Bre57a Bre58a Brm44h 127V W11226018 (i)', 'Motores'),
    ('SKU-MOT-007', '9432', 'Motor Ventilador Geladeira Electrolux DF51 DF52 127v', 'Motores'),
    ('SKU-MOT-008', '5898', 'Motor Ventilador Geladeira Para Consul CRM34 CRM42 CRM47 CRM50', 'Motores'),
    ('SKU-CON-001', '10040', 'Cont FG MT512E 2HP Biv 110/220V-50+75 Ref.03614', 'Controles/Capacitores'),
    ('SKU-VAL-001', '5016', 'Valvula Solda Schrader 1/4 100mm Unidade', 'Valvulas'),
    ('SKU-VAL-002', '4958', 'Valvula Entrada Dupla Lavadora Brastemp Consul 6 8 9 10 11kg (110v) 326007074 W11172282 W11364875', 'Valvulas'),
    ('SKU-VAL-003', '4965', 'Valvula Entrada Dupla Lavadora Electrolux 12kg Lte12 Lt12 Ltc12 110V', 'Valvulas'),
    ('SKU-VAL-004', '5204', 'Valvula Entrada Lavadora Brastemp Consul Cwe15 cwl16 Bwk12 Bwr12 Bwk14 W10889917 W11104451 W11245249 W11242970 127V Emic', 'Valvulas'),
    ('SKU-FIL-001', '2250', 'Filtro Secador 3/4 Com 10g Silica Com Rabicho Capilar Refrigeracao Un', 'Filtros'),
    ('SKU-SEN-001', '4389', 'Sensor Temperatura Geladeira Brastemp Consul 2,7k W10531315 Original', 'Sensores'),
    ('SKU-SEN-002', '4385', 'Sensor Temperatura Geladeira Comp. Bosch Kdn 42/43/46/47/48/49/50 RDN REBS RECT REMB RFCO RFCT', 'Sensores'),
    ('SKU-SEN-003', '9563', 'Sensor Temperatura Geladeira Comp. Panasonic Nrbt47 Degelo', 'Sensores'),
    ('SKU-SEN-004', '9712', 'Sensor Temperatura Geladeira Comp. Panasonic 2k Nr-bt54 Nr-bb52 AG-168580 NR-BT54 NR-BT40', 'Sensores'),
    ('SKU-TER-001', '4704', 'Termostato Microondas Ksd 250v 10a 180 Unidade', 'Termostatos'),
    ('SKU-PRO-001', '3926', 'Protetor Termico 110v Compativel com motores de 1/3 a 1/12', 'Protetores'),
    ('SKU-REL-001', '5179', 'Rele Ptc 4 Pinos Partida Geladeira Refrigerador Freezer 127V', 'Reles'),
    ('SKU-DIO-001', '1754', 'Diodo Microondas', 'Microondas'),
    ('SKU-MAG-001', '2669', 'Magnetron Microondas Electrolux 2m219j 2m319j M24fb Mef41 Etc Grande (Compativel Electrolux e Panasonic)', 'Microondas'),
    ('SKU-MIC-001', '2904', 'Microchave 3 Pinos Importada', 'Microondas'),
    ('SKU-MIC-002', '2902', 'Microchave 2 Pinos Importada', 'Microondas'),
    ('SKU-KIT-001', '9355', 'Kit Tirante Da Suspensao Lavadora Brastemp Consul branco 7 a 11kg 326000516 (I) (4 UNIDADES)', 'Suspensao'),
    ('SKU-KIT-002', '9350', 'Kit Tirante Da Suspensao Lavadora Brastemp Consul Preto 326000047 (I) (4 UNIDADES)', 'Suspensao'),
    ('SKU-AMO-001', '9201', 'Amortecedor Lava E Seca Para Samsung Wd085 103 106 10J 10M 11J 11M 856 885 90J WF106 Ww11 M809 80N', 'Amortecedores'),
    ('SKU-AMO-002', '1091', 'Amortecedor Lava E Seca Para Electrolux / LG Lse09 Lsi09 Lse12 1A700110 A09087001 41056961', 'Amortecedores'),
    ('SKU-MAN-001', '2716', 'Mangueira Entrada Lavadora 1,2M Afa', 'Mangueiras'),
    ('SKU-MAN-002', '2718', 'Mangueira Entrada Lavadora 3,0M Afa', 'Mangueiras'),
    ('SKU-MAN-003', '2722', 'Mangueira Drenagem Lavadora 1,8M Bocal Grosso Curvo 28mm Para Brastemp Consul Colormaq AFA', 'Mangueiras'),
    ('SKU-ATU-001', '1109', 'Atuador Acoplamento 127V', 'Atuadores'),
    ('SKU-RES-001', '4124', 'Resistencia Para Geladeira Comp. Bosch Dreno Kdn42 Kdn43 Kdn46 127V', 'Resistencias'),
    ('SKU-PLA-001', '3587', 'Placa Lav. Para Electrolux Inter. LAC16 LAI17 LAP16 LPR13 LPR14 LPR16 LPR17 A99035301 Bivolt', 'Placas'),
    ('SKU-PLA-002', '8889', 'Placa Lav. Para Electrolux Inter. Led13 Led14 Led15 Led17 A20246001', 'Placas'),
    ('SKU-PLA-003', '9688', 'Placa Geladeira Para Electrolux DF47 DFN49 DFN50 DFX49 DFX50 DFW50 DF43 DF46 DF48 DFW48 DW48 DF36 DFN39 DFX39', 'Placas'),
    ('SKU-PLA-004', '3421', 'Placa Geladeira Para Electrolux Inter. DCW49 DF43 46 48 48X 49 DFW48 DFW49 DW48X 64800224 41012958', 'Placas'),
    ('SKU-PLA-005', '3603', 'Placa Lav. Para Electrolux Inter. Lte12 V.2 Irene 2 Com Chicote 64502207', 'Placas'),
    ('SKU-PLA-006', '3557', 'Placa Lav. Para Consul Inter. Cwg12 cwe10 cwe11 cwk12 W10597230', 'Placas'),
    ('SKU-SAL-001', '10167', 'Salva Tanque Lavadora Brastemp Consul Mondial', 'Suportes'),
    ('SKU-SUP-001', '4438', 'Suporte Cesto Lava E Seca Para Samsung WD085 WD103 WD106 WD10 WD11 WD856 WD8854 WD90 WF8854 DC97-14370 Tripe', 'Suportes'),
    ('SKU-RET-001', '4210', 'Retentor Lava e Seca Para Samsung Dc62-00008a Wd085 Wd885 Wd106', 'Retentores'),
    ('SKU-PAR-001', '9422', 'Parafuso Eixo Tripe Lava E Seca Samsung Dc-60-40137a Unitario', 'Parafusos'),
    ('SKU-FLU-005', 'OLBWD208', 'Fluxo Pasta Solda 50gr Aron Ligas Prata E Foscoper Bga', 'Gases/Solda')
)
update produtos p
   set sku = c.sku,
       categoria = coalesce(p.categoria, c.categoria)
  from cat c
 where p.sku is null
   and btrim(lower(p.codigo)) = btrim(lower(c.codigo));


-- ------------------------------------------------------------
-- PASSO 3 - Insere SOMENTE os produtos que ainda nao existem.
-- Entram com quantidade 0 e preco 0 (o PDF veio todo zerado);
-- voce ajusta depois na tela de Estoque.
-- ------------------------------------------------------------
with cat(sku, codigo, nome, categoria) as (
  values
    ('SKU-CAR-001', 'GAS-MAPP-400', 'Cartucho Gas Mapp Hulter 400gr (ONU1077 Classe 2.1 Propileno)', 'Gases/Solda'),
    ('SKU-FLU-001', '10461', 'Fluido Refrigerante Pro134 300G', 'Gases'),
    ('SKU-FLU-002', '10462', 'Fluido Refrigerante Pro134 6Kg', 'Gases'),
    ('SKU-GAS-001', '2342', 'Gas Geladeira/Ar Condicionado R134a R134 750g', 'Gases'),
    ('SKU-FLU-003', '100273961', 'Fluido Ref R600A Isobutano Lata 420G Hulter', 'Gases'),
    ('SKU-FLU-004', 'R404A-600', 'Fluido Ref R404A 600G com Valvula Hulter (ONU3337)', 'Gases'),
    ('SKU-ELE-001', '100291669', 'Eletrobomba DR Univ S/Copo Proteg Fio Fusivel 127V Emicol', 'Motores/Bombas'),
    ('SKU-ELE-002', '1861', 'Eletrobomba Lavadora Universal 127V', 'Motores/Bombas'),
    ('SKU-MOT-001', '10550', 'Motor Compressor Geladeira Electrolux A30651901 EL80H 1/4 R134a DM84X DC45 DC47A DC47 DC47G DC49A DCW50 127v', 'Motores/Compressores'),
    ('SKU-MOT-002', '5173', 'Motor Compressor Geladeira 1/4+ EMR80HLR R134 127v Embraco', 'Motores/Compressores'),
    ('SKU-UNI-001', 'UCP4190', 'Unidade Compressora 1.1/4 HP 220V-1 R404 C/TQ Compacta', 'Motores/Compressores'),
    ('SKU-MOT-003', '3059', 'Motor Prato Microondas Fischer Tyj50-8 49tyj 127v', 'Motores'),
    ('SKU-MOT-004', '2938', 'Motor 1/25 Exaustor Freezer Balcao 110/220 Helice Aluminio 25cm', 'Motores'),
    ('SKU-MOT-005', '2943', 'Motor 1/40 Exaustor Freezer Balcao 110/220 Bucha Plastico Helice Plastico 20cm', 'Motores'),
    ('SKU-MOT-006', '9634', 'Motor Ventilador Geladeira Brastemp Bre57a Bre58a Brm44h 127V W11226018 (i)', 'Motores'),
    ('SKU-MOT-007', '9432', 'Motor Ventilador Geladeira Electrolux DF51 DF52 127v', 'Motores'),
    ('SKU-MOT-008', '5898', 'Motor Ventilador Geladeira Para Consul CRM34 CRM42 CRM47 CRM50', 'Motores'),
    ('SKU-CON-001', '10040', 'Cont FG MT512E 2HP Biv 110/220V-50+75 Ref.03614', 'Controles/Capacitores'),
    ('SKU-VAL-001', '5016', 'Valvula Solda Schrader 1/4 100mm Unidade', 'Valvulas'),
    ('SKU-VAL-002', '4958', 'Valvula Entrada Dupla Lavadora Brastemp Consul 6 8 9 10 11kg (110v) 326007074 W11172282 W11364875', 'Valvulas'),
    ('SKU-VAL-003', '4965', 'Valvula Entrada Dupla Lavadora Electrolux 12kg Lte12 Lt12 Ltc12 110V', 'Valvulas'),
    ('SKU-VAL-004', '5204', 'Valvula Entrada Lavadora Brastemp Consul Cwe15 cwl16 Bwk12 Bwr12 Bwk14 W10889917 W11104451 W11245249 W11242970 127V Emic', 'Valvulas'),
    ('SKU-FIL-001', '2250', 'Filtro Secador 3/4 Com 10g Silica Com Rabicho Capilar Refrigeracao Un', 'Filtros'),
    ('SKU-SEN-001', '4389', 'Sensor Temperatura Geladeira Brastemp Consul 2,7k W10531315 Original', 'Sensores'),
    ('SKU-SEN-002', '4385', 'Sensor Temperatura Geladeira Comp. Bosch Kdn 42/43/46/47/48/49/50 RDN REBS RECT REMB RFCO RFCT', 'Sensores'),
    ('SKU-SEN-003', '9563', 'Sensor Temperatura Geladeira Comp. Panasonic Nrbt47 Degelo', 'Sensores'),
    ('SKU-SEN-004', '9712', 'Sensor Temperatura Geladeira Comp. Panasonic 2k Nr-bt54 Nr-bb52 AG-168580 NR-BT54 NR-BT40', 'Sensores'),
    ('SKU-TER-001', '4704', 'Termostato Microondas Ksd 250v 10a 180 Unidade', 'Termostatos'),
    ('SKU-PRO-001', '3926', 'Protetor Termico 110v Compativel com motores de 1/3 a 1/12', 'Protetores'),
    ('SKU-REL-001', '5179', 'Rele Ptc 4 Pinos Partida Geladeira Refrigerador Freezer 127V', 'Reles'),
    ('SKU-DIO-001', '1754', 'Diodo Microondas', 'Microondas'),
    ('SKU-MAG-001', '2669', 'Magnetron Microondas Electrolux 2m219j 2m319j M24fb Mef41 Etc Grande (Compativel Electrolux e Panasonic)', 'Microondas'),
    ('SKU-MIC-001', '2904', 'Microchave 3 Pinos Importada', 'Microondas'),
    ('SKU-MIC-002', '2902', 'Microchave 2 Pinos Importada', 'Microondas'),
    ('SKU-KIT-001', '9355', 'Kit Tirante Da Suspensao Lavadora Brastemp Consul branco 7 a 11kg 326000516 (I) (4 UNIDADES)', 'Suspensao'),
    ('SKU-KIT-002', '9350', 'Kit Tirante Da Suspensao Lavadora Brastemp Consul Preto 326000047 (I) (4 UNIDADES)', 'Suspensao'),
    ('SKU-AMO-001', '9201', 'Amortecedor Lava E Seca Para Samsung Wd085 103 106 10J 10M 11J 11M 856 885 90J WF106 Ww11 M809 80N', 'Amortecedores'),
    ('SKU-AMO-002', '1091', 'Amortecedor Lava E Seca Para Electrolux / LG Lse09 Lsi09 Lse12 1A700110 A09087001 41056961', 'Amortecedores'),
    ('SKU-MAN-001', '2716', 'Mangueira Entrada Lavadora 1,2M Afa', 'Mangueiras'),
    ('SKU-MAN-002', '2718', 'Mangueira Entrada Lavadora 3,0M Afa', 'Mangueiras'),
    ('SKU-MAN-003', '2722', 'Mangueira Drenagem Lavadora 1,8M Bocal Grosso Curvo 28mm Para Brastemp Consul Colormaq AFA', 'Mangueiras'),
    ('SKU-ATU-001', '1109', 'Atuador Acoplamento 127V', 'Atuadores'),
    ('SKU-RES-001', '4124', 'Resistencia Para Geladeira Comp. Bosch Dreno Kdn42 Kdn43 Kdn46 127V', 'Resistencias'),
    ('SKU-PLA-001', '3587', 'Placa Lav. Para Electrolux Inter. LAC16 LAI17 LAP16 LPR13 LPR14 LPR16 LPR17 A99035301 Bivolt', 'Placas'),
    ('SKU-PLA-002', '8889', 'Placa Lav. Para Electrolux Inter. Led13 Led14 Led15 Led17 A20246001', 'Placas'),
    ('SKU-PLA-003', '9688', 'Placa Geladeira Para Electrolux DF47 DFN49 DFN50 DFX49 DFX50 DFW50 DF43 DF46 DF48 DFW48 DW48 DF36 DFN39 DFX39', 'Placas'),
    ('SKU-PLA-004', '3421', 'Placa Geladeira Para Electrolux Inter. DCW49 DF43 46 48 48X 49 DFW48 DFW49 DW48X 64800224 41012958', 'Placas'),
    ('SKU-PLA-005', '3603', 'Placa Lav. Para Electrolux Inter. Lte12 V.2 Irene 2 Com Chicote 64502207', 'Placas'),
    ('SKU-PLA-006', '3557', 'Placa Lav. Para Consul Inter. Cwg12 cwe10 cwe11 cwk12 W10597230', 'Placas'),
    ('SKU-SAL-001', '10167', 'Salva Tanque Lavadora Brastemp Consul Mondial', 'Suportes'),
    ('SKU-SUP-001', '4438', 'Suporte Cesto Lava E Seca Para Samsung WD085 WD103 WD106 WD10 WD11 WD856 WD8854 WD90 WF8854 DC97-14370 Tripe', 'Suportes'),
    ('SKU-RET-001', '4210', 'Retentor Lava e Seca Para Samsung Dc62-00008a Wd085 Wd885 Wd106', 'Retentores'),
    ('SKU-PAR-001', '9422', 'Parafuso Eixo Tripe Lava E Seca Samsung Dc-60-40137a Unitario', 'Parafusos'),
    ('SKU-FLU-005', 'OLBWD208', 'Fluxo Pasta Solda 50gr Aron Ligas Prata E Foscoper Bga', 'Gases/Solda')
)
insert into produtos (nome, codigo, sku, categoria, quantidade, preco_custo, preco_venda)
select c.nome, c.codigo, c.sku, c.categoria, 0, 0, 0
  from cat c
 where not exists (select 1 from produtos p where p.sku = c.sku)
   and not exists (select 1 from produtos p where btrim(lower(p.codigo)) = btrim(lower(c.codigo)));


-- ------------------------------------------------------------
-- PASSO 4 - Conferencia final
-- ------------------------------------------------------------
select count(*) as total_agora,
       count(sku) as com_sku,
       count(*) filter (where quantidade > 0) as com_estoque
  from produtos;

-- lista por categoria
select categoria, count(*) as itens
  from produtos
 group by categoria
 order by itens desc;


-- ============================================================
-- OPCIONAL - ajustar quantidade depois (exemplos)
-- ============================================================
-- update produtos set quantidade = 5 where sku = 'SKU-MOT-001';
-- update produtos set quantidade = 0 where sku = 'SKU-FIL-001';  -- filtro acabou
-- update produtos set preco_custo = 120, preco_venda = 210 where sku = 'SKU-MOT-001';
