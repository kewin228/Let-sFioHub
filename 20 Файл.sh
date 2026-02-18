# 1. Клонируйте/создайте структуру
mkdir letsfiohub
cd letsfiohub

# 2. Создайте backend
mkdir -p backend/app/routers backend/app/services
# Скопируйте ваши файлы в соответствующие папки

# 3. Создайте frontend
npx create-react-app frontend --template typescript
# Замените package.json и добавьте ваши компоненты

# 4. Установите зависимости
cd backend
pip install -r requirements.txt

cd ../frontend
npm install

# 5. Запустите через Docker
docker-compose up --build