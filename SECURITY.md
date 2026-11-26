# Segurança — Minha Lista de Mercado

Desenvolvido por Eder Rodrigues — LIVREZON TECNOLOGIA · contato@livrezon.com.br

## Como reportar uma vulnerabilidade
Envie para **contato@livrezon.com.br** com o assunto "Segurança". Não publique a falha antes da correção. Respondemos em até 5 dias úteis.

## Modelo de ameaça (o que protegemos)
| Ameaça | Controle |
|---|---|
| Ler ou alterar dados de outra família | Regras do Firestore: acesso só para membros (`isMember`), negação por padrão em tudo o mais |
| Liberar o Premium sem pagar | O campo `plan` só é gravado pelo Master ou pelo servidor de pagamentos. Testado: "Se autopromove a Premium" bloqueado |
| Entrar numa família sem convite | Convite aleatório de 24 caracteres, válido por 48 h, máximo de 6 membros; o convidado só adiciona a si mesmo |
| Injeção de campos e dados gigantes | Toda gravação valida campos permitidos, tipos, tamanhos e limites numéricos |
| XSS (script malicioso em nome de item, lista etc.) | Todo texto exibido passa por `esc()`; CSP bloqueia scripts de terceiros; backup restaurado é saneado (`sanitizeState`) |
| Clickjacking (app dentro de iframe falso) | O app se recusa a rodar dentro de iframe |
| Roubo de conta Master | Login Google com e-mail verificado e checagem dupla (tela e regras); toda ação vai para uma auditoria imutável. **Pendente: ativar a verificação em duas etapas** |
| Uso abusivo da API | Limites de tamanho nas regras. **Pendente: restringir a chave de API por domínio e ativar o App Check** |
| Listagem/enumeração | `list` negado para usuários: ninguém consegue listar listas, famílias ou contas |
| Dados em trânsito | Somente HTTPS (Enforce HTTPS no GitHub Pages) |

## Testes de invasão
`/seguranca-teste.html` executa os ataques contra o banco real (anônimo e conta Google comum). Todos devem aparecer como BLOQUEADO. Rode depois de publicar novas regras ou mudar o app.

## Checklist a cada atualização
- [ ] Regras publicadas iguais ao arquivo `firestore.rules`
- [ ] Teste de invasão 100% aprovado
- [ ] Nenhum segredo no código (a configuração do Firebase não é segredo; chaves do Mercado Pago **nunca** entram no app, só no servidor)
- [ ] Bibliotecas locais atualizadas (Firebase, jsPDF, ZXing)
- [ ] Master Backup gerado antes de publicar

## Pendências de configuração (responsável: Eder)
1. Verificação em duas etapas na conta Master.
2. Google Cloud → APIs e serviços → Credenciais: restringir a "Browser key" aos referenciadores `https://mercado.livrezon.com.br/*`.
3. App Check com reCAPTCHA (antes da divulgação pública).

## Limitações conhecidas
- GitHub Pages não permite cabeçalhos HTTP próprios (HSTS longo, frame-ancestors). A mitigação está no próprio app: CSP via meta e bloqueio de iframe.
- Quem tem o link de uma lista compartilhada pode editá-la. É uma escolha de produto, avisada na tela.
