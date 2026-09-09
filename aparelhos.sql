-- Varios aparelhos na mesma OS.
--
-- Guarda a lista estruturada: [{ "nome": "...", "servico": "...", "valor": 0 }]
-- As colunas produto e servico continuam sendo gravadas em texto (montadas a
-- partir dessa lista), entao NADA do que ja existe deixa de funcionar e
-- nenhuma OS antiga precisa ser mexida.
--
-- Rodar no SQL Editor do Supabase.

alter table ordens_servico
  add column if not exists aparelhos jsonb;

comment on column ordens_servico.aparelhos is
  'Lista de aparelhos da OS: [{nome, servico, valor}]. produto/servico sao o mesmo conteudo em texto, mantidos por compatibilidade.';
