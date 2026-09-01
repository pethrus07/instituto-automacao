-- =========================================================================
-- 003 · apaga o que foi coletado antes de perguntar
--
-- O coletor passou a ler o robots.txt em 01/09/2026. Antes disso ja tinha
-- guardado 50 itens de tres fontes que, medidas depois, dizem `Disallow`
-- para o caminho do feed: Reddit r/PLC (25), YouTube (15) e GitHub releases
-- (10). Nenhum chegou a ser publicado.
--
-- Guardar esses itens tornaria FALSA uma frase que o /blueprints publica —
-- "fonte que bloqueia robo nao entra". Base que contradiz a propria pagina
-- de metodo vale menos que a base menor. E item nao coletado nao volta, sim:
-- e esse o custo, e ele e assumido de olhos abertos.
--
-- As FONTES continuam na tabela, com o veredito e o motivo a vista. Sumir
-- com elas esconderia justamente o que se quer mostrar.
--
--   npm run db:migrar
-- =========================================================================

DELETE FROM item
 WHERE fonte_id IN (SELECT id FROM fonte WHERE robots_permite = 0);

-- Assunto que ficou sem nenhum item nao e mais um assunto: e residuo, e
-- contaria no Panorama como se fosse pauta.
DELETE FROM assunto
 WHERE id NOT IN (SELECT assunto_id FROM item WHERE assunto_id IS NOT NULL);

-- E o contador volta a bater com a realidade.
UPDATE assunto
   SET qtd_itens = (SELECT COUNT(*) FROM item WHERE item.assunto_id = assunto.id);
