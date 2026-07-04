const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')
const backButton = document.getElementById('dateBackBtn')
const forwardButton = document.getElementById('dateForwardBtn')
const currentDayText = document.getElementById('currentDayText')
const chartElement = document.getElementById('chart')

setButton.addEventListener('click', () => {
  window.electronAPI.pushToDatabase();
})

backButton.addEventListener('click', () => {
  window.electronAPI.backOneDay();
  loadContent();
})

forwardButton.addEventListener('click', () => {
  window.electronAPI.forwardOneDay();
  loadContent();
})

window.addEventListener('keydown', (event) => {
  if (event.key == "F12") {
    window.electronAPI.devToolsSwitch();
  }
})

// Renderer side to call something when app is closing!
window.addEventListener('beforeunload', (event) => {
  // Notify the main process via IPC to start saving data immediately
  // window.electronAPI.sendShutdownSignal(); 
  // console.log("unloaded!");
  // window.electronAPI.exampleFunction();
});

let chart;

const createChart = (piechartData) => {  
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartElement, {
  type: "doughnut",
  data: {
    labels: piechartData.labels,
    datasets: [{
      label: 'My First Dataset',
      data: piechartData.piechartData,
      backgroundColor: piechartData.backgroundColor,
      hoverOffset: 4
    }]
  },
  options: {}
  });
}

async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();

  // Set to none as done loading
  databaseText.innerText = "";
  
  currentDayText.innerText = await window.electronAPI.grabCurrentDate();

  createChart(data);
};


loadContent();