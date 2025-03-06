const citySelect = document.getElementById('citySelect');
const timeDisplay = document.getElementById('time');

function updateTime() {
    const timeZone = citySelect.value;
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    timeDisplay.textContent = `Текущее время: ${timeString}`;
}

citySelect.addEventListener('change', updateTime);
setInterval(updateTime, 1000);
updateTime();