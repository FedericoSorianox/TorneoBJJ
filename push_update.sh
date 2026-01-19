#!/bin/bash
set -e

# Ruta del proyecto Landing
PROJECT_PATH="/Users/fede/Thebadgerspage1.1/thebadgerspage1.1"

echo "🚀 Iniciando actualización para: $PROJECT_PATH"

cd "$PROJECT_PATH"

# Verificar estado
echo "🔍 Verificando cambios..."
git status

# Agregar cambios (el Navbar modificado)
git add .

# Commit
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No hay cambios pendientes."
else
    echo "Snapshot: Guardando cambios en el Navbar..."
    git commit -m "feat: Agregar botón de acceso directo a App Torneos"
    
    echo "⬆️  Subiendo cambios a origin..."
    git push
    echo "✅  Cambios subidos correctamente. El deploy debería comenzar automáticamente."
fi
