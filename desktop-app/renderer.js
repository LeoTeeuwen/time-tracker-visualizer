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

const createChart = () => {  
  if (chart) {
    chart.destroy();
  }
  const xyValues = [
  {x:50, y:7},
  {x:60, y:8},
  {x:70, y:8},
  {x:80, y:9},
  {x:90, y:9},
  {x:100, y:9},
  {x:110, y:10},
  {x:120, y:11},
  {x:130, y:14},
  {x:140, y:14},
  {x:150, y:15}
  ];

  chart = new Chart(chartElement, {
  type: "doughnut",
  data: {
    labels: [
      'Red',
      'Blue',
      'Yellow'
    ],
    datasets: [{
      label: 'My First Dataset',
      data: [35, 50, 100],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  },
  options: {}
  // data: {
  //     datasets: [{
  //     pointRadius: 4,
  //     pointBackgroundColor: "rgba(0,0,255,1)",
  //     data: xyValues
  //     }]
  // },
  });
}

async function loadContent() {
  // Update the tag to connect renderer with main process
  const data = await window.electronAPI.grabAllDataFromDatabase();
  
  databaseText.innerText = data;
  
  currentDayText.innerText = await window.electronAPI.grabCurrentDate();

  createChart();
};


loadContent();