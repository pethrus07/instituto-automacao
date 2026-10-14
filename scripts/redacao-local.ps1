<#
  A REDAÇÃO DO DIA, rodando no notebook do Pedro (14/10/2026).

  A rotina na nuvem do Claude exigiria conectar o GitHub à conta do Claude, que é
  compartilhada — não serve. Então a redação roda aqui: o Claude Code que vem com a
  extensão do VS Code, em modo sem janela, num CLONE SÓ DELA (nunca na pasta em que o
  Pedro trabalha), seguindo docs/REDACAO.md. O push usa o git já logado nesta máquina;
  o GitHub faz o QA e o deploy (publicar.yml).

    .\scripts\redacao-local.ps1                 roda agora
    .\scripts\redacao-local.ps1 -Instalar       cria a tarefa no Agendador (07:30 e 15:30)
    .\scripts\redacao-local.ps1 -Desinstalar    remove a tarefa

  Registro de cada execução: <clone>\..\logs\AAAA-MM-DD_HHMM.log

  Se o notebook estiver desligado no horário, a tarefa roda quando ele ligar. Se passar
  dois dias sem notícia nova, o vigia do GitHub (vigia.yml) falha e manda e-mail.
#>
param(
  [switch]$Instalar,
  [switch]$Desinstalar,
  [string]$Base = "$env:USERPROFILE\Projetos\_redacao-instituto",
  [string]$Modelo = 'claude-sonnet-5-5'
)
$ErrorActionPreference = 'Stop'
$Tarefa = 'Instituto Automacao - Redacao do dia'
$Repo = 'https://github.com/pethrus07/instituto-automacao.git'
$Clone = Join-Path $Base 'instituto-automacao'
$Logs = Join-Path $Base 'logs'

if ($Desinstalar) {
  Unregister-ScheduledTask -TaskName $Tarefa -Confirm:$false
  Write-Host "Tarefa removida: $Tarefa"
  return
}

if ($Instalar) {
  New-Item -ItemType Directory -Force $Base | Out-Null
  $destino = Join-Path $Base 'redacao-local.ps1'
  Copy-Item $PSCommandPath $destino -Force   # a tarefa roda a cópia, que não some com um git reset
  $acao = New-ScheduledTaskAction -Execute 'pwsh.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$destino`""
  $gatilhos = @(
    (New-ScheduledTaskTrigger -Daily -At '07:30'),
    (New-ScheduledTaskTrigger -Daily -At '15:30')
  )
  $config = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName $Tarefa -Action $acao -Trigger $gatilhos -Settings $config `
    -Description 'Escreve, confere e publica as notícias do Instituto Automação (docs/REDACAO.md).' -Force | Out-Null
  Write-Host "Tarefa criada: $Tarefa (07:30 e 15:30; se perder o horário, roda ao ligar)"
  return
}

# ------------------------------------------------------------------ a execução
New-Item -ItemType Directory -Force $Logs | Out-Null
$log = Join-Path $Logs ((Get-Date -Format 'yyyy-MM-dd_HHmm') + '.log')
function Registrar($t) { "$(Get-Date -Format 'HH:mm:ss') $t" | Tee-Object -FilePath $log -Append | Out-Host }

try {
  # O Claude Code da extensão do VS Code: a pasta muda de nome a cada atualização.
  $ext = Get-ChildItem "$env:USERPROFILE\.vscode\extensions" -Directory -Filter 'anthropic.claude-code-*-win32-x64' |
    Sort-Object { [version](($_.Name -split '-')[2]) } | Select-Object -Last 1
  if (-not $ext) { throw 'não achei a extensão do Claude Code no VS Code' }
  $claude = Join-Path $ext.FullName 'resources\native-binary\claude.exe'
  Registrar "claude: $($ext.Name)"

  # O clone é só da redação: pode ser posto igual ao main sem medo.
  if (-not (Test-Path (Join-Path $Clone '.git'))) {
    Registrar 'clonando o repositório'
    git clone --quiet $Repo $Clone 2>&1 | Out-Null
  }
  Set-Location $Clone
  git fetch --quiet origin 2>&1 | Out-Null
  git reset --quiet --hard origin/main
  git clean -fdq -e node_modules -e colheita
  Registrar "main em $(git rev-parse --short HEAD)"

  # npm ci só quando o lockfile mudou (leva minutos).
  $hash = (Get-FileHash package-lock.json).Hash
  $marca = Join-Path $Base 'lock.hash'
  if (-not (Test-Path node_modules) -or -not (Test-Path $marca) -or (Get-Content $marca) -ne $hash) {
    Registrar 'npm ci'
    npm ci --no-audit --no-fund 2>&1 | Out-File -Append $log
    if ($LASTEXITCODE -ne 0) { throw 'npm ci falhou' }
    Set-Content $marca $hash
  }

  $pedido = @'
Você é a Redação do Instituto Automação (https://institutoautomacao.com.br). Nesta execução, publique até 2 notícias novas do setor de automação, em português do Brasil, seguindo À RISCA docs/REDACAO.md. Leia esse arquivo inteiro antes de qualquer outra coisa, e leia as notícias de conteudo/noticias/ de 2026-09-24 e 2026-10-14 para pegar o tom.

O repositório já está atualizado e com as dependências instaladas: NÃO rode git pull nem npm ci. Comece no passo 2 do manual (npm run redacao -- candidatas).

Regras inegociáveis: nunca afrouxe uma trava; nunca edite scripts/, src/, qa/, docs/ ou .github/ — se uma trava parecer errada, não publique a notícia e diga isso no resumo final. Autor sempre "Redação do Instituto". Só números que estão na fonte. Sem trailer Co-Authored-By no commit. Rode `npm run compilar` e `npm test` separados, os dois têm de passar antes do commit. Publique com git add conteudo publico/imagens, git commit -m "noticias: <títulos curtos>" e git push origin main. Se não houver pauta boa, não publique (commite só conteudo/descartadas.txt, se mudou, com a mensagem "redacao: descartes do dia").

Termine com um resumo curto: o que publicou (título e /noticias/<slug>), o que descartou e por quê.
'@

  Registrar "redação começando ($Modelo)"
  $ferramentas = @('Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch',
    'Bash(npm run:*)', 'Bash(npm test:*)', 'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git add:*)',
    'Bash(git commit:*)', 'Bash(git push:*)', 'Bash(git log:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(rm publico/imagens/:*)', 'Bash(rm conteudo/noticias/:*)')
  & $claude -p $pedido --model $Modelo --permission-mode acceptEdits --allowedTools $ferramentas --max-turns 120 2>&1 |
    Out-File -Append -Encoding utf8 $log
  Registrar "redação terminou (código $LASTEXITCODE)"

  $novos = git log origin/main..HEAD --oneline
  if ($novos) { Registrar "commit que não subiu: $novos" }
}
catch {
  Registrar "ERRO: $($_.Exception.Message)"
  exit 1
}
