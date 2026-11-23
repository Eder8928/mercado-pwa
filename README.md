# Minha Lista de Mercado

App de lista de compras de supermercado (PWA) — **LIVREZON TECNOLOGIA**.
Desenvolvido por Eder Rodrigues — LIVREZON TECNOLOGIA · https://livrezon.com.br · contato@livrezon.com.br

## Funções
- Cadastro de itens com catálogo sugerido, controle do que há **em casa** e geração automática da lista do que falta.
- Listas de compras com orçamento, total do carrinho e previsão.
- **Leitor de código de barras** pela câmera, com cadastro automático pela base Open Food Facts.
- **Lista compartilhada** em tempo real (Firebase): várias pessoas comprando juntas, com o total somado de todos.
- Histórico, resultado da compra e relatórios em **PDF**.
- Funciona **offline**, sem cadastro, instalável no celular, tablet e computador.
- LGPD: dados locais no aparelho, aceite de termos, política de privacidade, exportação e exclusão de dados, expiração automática das listas na nuvem.
- **Painel Master** (`/master`): uso, manutenção, aviso global, versão mínima, suporte, Master Backup criptografado (AES-256) e log de auditoria imutável.

## Estrutura
App estático (HTML/JS sem build), hospedado no GitHub Pages. Bibliotecas incluídas localmente: Firebase JS SDK, ZXing (Apache-2.0) e jsPDF/jsPDF-AutoTable (MIT).
Configuração: veja `FIREBASE.md`.
