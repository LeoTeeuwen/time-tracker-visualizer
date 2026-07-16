const setButton = document.getElementById('basicDBButton');
const databaseText = document.getElementById('databaseOutputText')
const backButton = document.getElementById('dateBackBtn')
const forwardButton = document.getElementById('dateForwardBtn')
const currentDayText = document.getElementById('currentDayText')
const pieChartElement = document.getElementById('pie-chart')
const barChartElement = document.getElementById('bar-chart')
const showDayEndsBox = document.getElementById('show-day-ends')

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

// Trigger chart reload on check and uncheck
showDayEndsBox.addEventListener('change', (event) => {
  loadContent();
})

pieChartElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  // console.log("event!: ", e)
  if (e.ctrlKey) {
    // How we know it is a pinch! (ctrl + scrollwheel is used under the hood when gesturing a pinch on trackpad)
    // console.log("Pinched!")
  }
})
// chartElement.addEventListener('click', (e) => {
//   console.log("event!: ", e)
// })

let pieChart;

const createPieChart = (piechartData) => {  
  if (pieChart) {
    pieChart.destroy();
  }

  pieChart = new Chart(pieChartElement, {
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
  options: {
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: function(context) {
            return ""
          }
        }
      },
    }
  }
  });
}

let barChart;

const createBarChart = (data) => {
  if (barChart) {
    barChart.destroy();
  }
  
  barChart = new Chart(barChartElement, {
      type: 'bar',
      data: {
          labels: ['Time Spent'],
          datasets: data
      },
      options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
              x: {
                  stacked: true
              },
              y: {
                  stacked: true
              }
          }
      }
  });
}

async function loadContent() {  
  // Update the tag to connect renderer with main process
  const pieChartData = await window.electronAPI.grabAllDataFromDatabase(showDayEndsBox.checked);
  const barChartData = await window.electronAPI.grabBarChartTimeBreakdown();

  // Set to none as done loading
  databaseText.innerText = "";
  
  currentDayText.innerText = await window.electronAPI.grabCurrentDate();
  
  createPieChart(pieChartData);
  createBarChart(barChartData);
};


loadContent();