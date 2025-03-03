@echo off
echo Iniciando MongoDB...
start mongod --dbpath "C:\Program Files\MongoDB\Server\8.0\bin"

timeout /t 5

echo Iniciando servidor Node.js...
start cmd /k "cd /d C:\Users\lucas\aFazeres && npm run dev"

timeout /t 3

echo Abrindo o navegador...
start "" "http://localhost:3000"
