# Minha Lista de Mercado (PWA)

App pessoal de lista de compras: cadastro de itens, controle do que tem em casa, listas com orçamento, registro de compras e histórico de gastos.

- Leitura de código de barras pela câmera (BarcodeDetector nativo ou ZXing embutido). Produtos novos são buscados na base pública Open Food Facts / Open Beauty Facts / Open Products Facts para cadastro automático.
- Funciona offline (service worker) e pode ser instalado na tela inicial.
- Sem login. Os dados ficam salvos apenas no aparelho (localStorage); use **Opções → Backup** para guardar uma cópia.

Acesse: https://eder8928.github.io/mercado-pwa/

Biblioteca de leitura: [ZXing](https://github.com/zxing-js/library) (Apache-2.0), incluída em `zxing.min.js`.
