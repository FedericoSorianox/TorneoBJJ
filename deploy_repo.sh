#!/bin/bash
set -e

REPO_URL="https://github.com/FedericoSorianox/TorneoBJJ.git"

echo "🚀 Configurando repositorio y subiendo código..."

# Renombrar rama a main si estamos en master
git branch -M main || true

# Agregar remote si no existe
if git remote | grep -q origin; then
    echo "ℹ️  Remote 'origin' ya existe. Actualizando URL..."
    git remote set-url origin "$REPO_URL"
else
    echo "🔗 Agregando remote origin..."
    git remote add origin "$REPO_URL"
fi

# Agregar archivos
echo "📦 Agregando archivos..."
git add .

# Commit
echo "📸 Creando commit..."
git commit -m "feat: Initial release with Split Deployment config (Netlify/Railway)" || echo "⚠️  Nada para commitear"

# Push
echo "⬆️  Subiendo a GitHub..."
git push -u origin main

echo "✅  ¡Código subido exitosamente!"
