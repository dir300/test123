const citySelect = document.getElementById('citySelect');
const timeDisplay = document.getElementById('time');

// Функция для обновления времени
function updateTime() {
    const timeZone = citySelect.value;
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    timeDisplay.textContent = `Текущее время: ${timeString}`;
}

// Обновляем время при изменении выбора города
citySelect.addEventListener('change', updateTime);

// Обновляем время каждую секунду
setInterval(updateTime, 1000);

// Инициализация времени при загрузке страницы
updateTime();
