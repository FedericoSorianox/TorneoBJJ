#!/bin/bash
set -e

# Definir la ruta del proyecto
PROJECT_PATH="/Users/fede/Thebadgerspage1.1/thebadgerspage1.1"
REPO_NAME="the-badgers-page"

echo "🚀 Iniciando configuración del repositorio para: $PROJECT_PATH"

# Navegar al directorio
cd "$PROJECT_PATH"

# Inicializar Git si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git branch -M main
else
    echo "ℹ️  Repositorio Git ya inicializado."
fi

# Agregar archivos
echo "📝 Agregando archivos..."
git add .

# Commit
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No hay cambios para commitear."
else
    echo "📸 Creando commit..."
    git commit -m "feat: Integración con App Torneos y configuración inicial"
fi

# Crear repositorio en GitHub (si no existe remota)
if ! git remote | grep -q origin; then
    echo "Github octocat: Creando repositorio remoto '$REPO_NAME'..."
    # Intenta crear el repo. Si falla porque existe, no rompe el script (|| true) pero tratamos de añadirlo.
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push || {
        echo "⚠️  El repo podría ya existir o hubo un error. Intentando linkear..."
        git remote add origin "https://github.com/FedericoSorianox/$REPO_NAME.git" || true
        git push -u origin main
    }
else
    echo "cw  Remote 'origin' ya existe. Haciendo push..."
    git push -u origin main
fi

echo "✅  Repositorio listo en GitHub!"
echo "🌍  Ahora ve a Vercel.com -> Add New Project -> Import '$REPO_NAME' para desplegar."
