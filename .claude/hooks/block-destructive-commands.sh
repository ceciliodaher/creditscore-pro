#!/bin/bash
# Block Destructive Commands Hook
# Prevents dangerous operations that could damage the system
#
# This hook is triggered before Bash tool execution to prevent
# potentially destructive commands from being executed.

# Lista de padrões de comandos bloqueados
BLOCKED_COMMANDS=(
    "rm -rf /"
    "rm -rf \*"
    "dd if="
    "mkfs."
    "wipefs"
    "> /dev/sd"
    "format c:"
    "del /s /q"
)

# Verificar se o comando bash contém algum padrão perigoso
for pattern in "${BLOCKED_COMMANDS[@]}"; do
    if echo "$CLAUDE_TOOL_ARGS" | grep -qF "$pattern"; then
        echo "🚫 BLOCKED: Potentially destructive command detected"
        echo "Command pattern: $pattern"
        echo "Please review and confirm this operation manually"
        exit 1
    fi
done

# Permitir execução se nenhum padrão perigoso foi encontrado
exit 0
