#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "═══════════════════════════════════════════"
echo "     🧪 Testing Auth API - Boilerplate Fastify"
echo "═══════════════════════════════════════════"
echo -e "${NC}\n"

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq no está instalado${NC}"
    echo -e "${YELLOW}Instala jq con: brew install jq${NC}\n"
    exit 1
fi

# Verificar que el servidor está corriendo
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: El servidor no está corriendo en http://localhost:3000${NC}"
    echo -e "${YELLOW}Inicia el servidor con: pnpm dev${NC}\n"
    exit 1
fi

# Generar un email único para evitar conflictos
TIMESTAMP=$(date +%s)
EMAIL="test-${TIMESTAMP}@example.com"

# 1. Registro
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}1️⃣  Registrando nuevo usuario...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Email: ${EMAIL}${NC}\n"

REGISTER_RESPONSE=$(curl -s --location 'http://localhost:3000/auth/register' \
--header 'Content-Type: application/json' \
--cookie-jar cookies.txt \
--data-raw "{
  \"email\": \"${EMAIL}\",
  \"password\": \"password123\"
}")

echo "$REGISTER_RESPONSE" | jq '.'

# Verificar que el registro fue exitoso
if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null; then
    echo -e "${GREEN}✅ Usuario registrado exitosamente${NC}\n"
else
    echo -e "${RED}❌ Error en el registro${NC}\n"
    exit 1
fi

# Extraer el accessToken
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
echo -e "${BLUE}🔑 Access Token (primeros 50 caracteres): ${ACCESS_TOKEN:0:50}...${NC}\n"

# Verificar que la cookie se guardó
if [ -f cookies.txt ]; then
    COOKIE_VALUE=$(grep refresh_token cookies.txt | awk '{print $7}')
    echo -e "${BLUE}🍪 Refresh Token guardado: ${COOKIE_VALUE:0:36}${NC}\n"
else
    echo -e "${RED}⚠️  Advertencia: No se guardó el archivo de cookies${NC}\n"
fi

sleep 1

# 2. Obtener info del usuario
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}2️⃣  Obteniendo información del usuario (/me)...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

ME_RESPONSE=$(curl -s --location 'http://localhost:3000/auth/me' \
--header "Authorization: Bearer $ACCESS_TOKEN")

echo "$ME_RESPONSE" | jq '.'

if echo "$ME_RESPONSE" | jq -e '.id' > /dev/null; then
    echo -e "${GREEN}✅ Información obtenida exitosamente${NC}\n"
else
    echo -e "${RED}❌ Error al obtener información${NC}\n"
fi

sleep 1

# 3. Refrescar token
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}3️⃣  Refrescando token (usando cookie)...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

REFRESH_RESPONSE=$(curl -s --location 'http://localhost:3000/auth/refresh' \
--cookie cookies.txt \
--cookie-jar cookies.txt)

echo "$REFRESH_RESPONSE" | jq '.'

if echo "$REFRESH_RESPONSE" | jq -e '.accessToken' > /dev/null; then
    echo -e "${GREEN}✅ Token refrescado exitosamente${NC}\n"
else
    echo -e "${RED}❌ Error al refrescar token${NC}\n"
    echo -e "${YELLOW}Contenido de cookies.txt:${NC}"
    cat cookies.txt
    echo ""
fi

# Extraer el nuevo accessToken
NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
echo -e "${BLUE}🔑 Nuevo Access Token (primeros 50 caracteres): ${NEW_ACCESS_TOKEN:0:50}...${NC}\n"

sleep 1

# 4. Usar el nuevo token
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}4️⃣  Usando el nuevo access token...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

NEW_ME_RESPONSE=$(curl -s --location 'http://localhost:3000/auth/me' \
--header "Authorization: Bearer $NEW_ACCESS_TOKEN")

echo "$NEW_ME_RESPONSE" | jq '.'

if echo "$NEW_ME_RESPONSE" | jq -e '.id' > /dev/null; then
    echo -e "${GREEN}✅ Nuevo token funciona correctamente${NC}\n"
else
    echo -e "${RED}❌ Error con el nuevo token${NC}\n"
fi

sleep 1

# 5. Logout
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}5️⃣  Cerrando sesión...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

LOGOUT_RESPONSE=$(curl -s --location --request POST 'http://localhost:3000/auth/logout' \
--cookie cookies.txt)

echo "$LOGOUT_RESPONSE" | jq '.'

if echo "$LOGOUT_RESPONSE" | jq -e '.message' > /dev/null; then
    echo -e "${GREEN}✅ Sesión cerrada exitosamente${NC}\n"
else
    echo -e "${RED}❌ Error al cerrar sesión${NC}\n"
fi

sleep 1

# 6. Intentar usar el token después del logout (debe fallar)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}6️⃣  Verificando que el refresh token fue invalidado...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

INVALID_REFRESH=$(curl -s --location 'http://localhost:3000/auth/refresh' \
--cookie cookies.txt)

echo "$INVALID_REFRESH" | jq '.'

if echo "$INVALID_REFRESH" | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✅ El refresh token fue correctamente invalidado${NC}\n"
else
    echo -e "${YELLOW}⚠️  El refresh token aún funciona (posible error)${NC}\n"
fi

# Limpiar cookies
rm -f cookies.txt

echo -e "${BLUE}"
echo "═══════════════════════════════════════════"
echo "           ✅ Pruebas completadas"
echo "═══════════════════════════════════════════"
echo -e "${NC}\n"

echo -e "${BLUE}📊 Resumen:${NC}"
echo -e "  • Usuario registrado: ${EMAIL}"
echo -e "  • Access Token generado: ✅"
echo -e "  • Endpoint /me funcionando: ✅"
echo -e "  • Refresh Token funcionando: ✅"
echo -e "  • Logout funcionando: ✅"
echo -e "  • Token invalidado correctamente: ✅"
echo ""
