monthNames = [
  "",
  "",
  "Enero",
  "",
  "",
  "",
  "Febrero",
  "",
  "",
  "",
  "Marzo",
  "",
  "",
  "",
  "Abril",
  "",
  "",
  "",
  "Mayo",
  "",
  "",
  "",
  "Junio",
  "",
  "",
  "",
  "Julio",
  "",
  "",
  "",
  "Agosto",
  "",
  "",
  "",
  "",
  "Septiembre",
  "",
  "",
  "",
  "",
  "Octubre",
  "",
  "",
  "",
  "",
  "Noviembre",
  "",
  "",
  "",
  "",
  "Diciembre",
];

const daysOfWeek = [
  "Sábado",
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
];

const API = "https://api.ajr.moe/logs?userId=";

let jsonData = [];

let chart;

document.addEventListener("DOMContentLoaded", function () {
  //Direct Search ID
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("userId");
  const downloadBoolean = urlParams.get("download")

  if (userId) {
    
    fetchData(userId);

    if(downloadBoolean == "true"){
      setTimeout(function(){
        downloadChart()
      }, 2000)
    }
  } else {
    console.log("manual");
    idDiv = document.querySelector("#id-input");
    buttonSubmit = document.querySelector("#btn-submit");

    buttonSubmit.addEventListener("click", function () {
      let ID = idDiv.value;

      fetchData(ID);
    });
  }

  const themeButton = document.querySelector("#theme");
  const htmlElement = document.documentElement;
  themeButton.addEventListener("click", function () {
    console.log("click");

    htmlElement.style.filter =
      htmlElement.style.filter === "invert(100%)"
        ? "invert(0%)"
        : "invert(100%)";
  });
});

function fetchData(ID) {
  fetch(API + ID)
    .then((response) => {
      return response.json(); // Return the Promise from response.json()
    })
    .then((data) => {
      // Further processing of jsonData can be done here
      jsonData = data;

      // Process the data and update the chart
      processDataAndRenderChart();
    })
    .catch((error) => {
      console.error("Error:", error);
      // Handle errors if any
    });
}

function downloadChart() {
  console.log("downloading")
  html2canvas(document.getElementById('chart')).then(function(canvas) {
    var link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'chart.png';
    link.click();
  });
}

function processDataAndRenderChart() {
  if (typeof chart !== "undefined") {
    chart.destroy();
  }
  const processedDates = [];
  let daysImmersed = 0;
  const daysPassed = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 1)) /
      (24 * 60 * 60 * 1000)
  );

  const heatmapData = new Array(7).fill(null).map(() => new Array(52).fill(0));

  function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const daysPassed = Math.ceil((date - firstDayOfYear) / 86400000);
    const weekNumber = Math.ceil(
      (daysPassed + firstDayOfYear.getDay() + 1) / 7
    );
    return Math.min(52, weekNumber); // Limit to 52 weeks in a year
  }

  jsonData.forEach((dataPoint) => {
    const date = new Date(dataPoint.timestamp * 1000);
    if (date.getFullYear() === 2023) {
      const dateString = date.toISOString().split("T")[0];
      const dayIndex = date.getDay();
      const weekIndex = getWeekNumber(date);

      // Check if the date is already processed
      if (!processedDates.includes(dateString)) {
        // Record the date
        processedDates.push(dateString);

        if (!heatmapData[dayIndex]) {
          heatmapData[dayIndex] = [];
        }

        if (!heatmapData[dayIndex][weekIndex]) {
          heatmapData[dayIndex][weekIndex] = 0;
        }

        // Update heatmapData array with reversed month order
        heatmapData[dayIndex][weekIndex] += dataPoint.puntos.toFixed(1);

        if (dataPoint.puntos > 0) {
          daysImmersed += 1;
        }
      }
    }
  });

  // Apex chart setup...
  const options = {
    series: heatmapData.map((data, index) => ({
      name: daysOfWeek[index],
      data: data || [],
    })),
    plotOptions: {
      heatmap: {
        radius: 0,
        distributed: true,
        useFillColorAsStroke: false,
        enableShades: true,
        shadeIntensity: 0.5,
      },
    },
    chart: {
      height: "100%",
      type: "heatmap",
      background: 'white'
    },
    dataLabels: {
      enabled: false,
    },
    colors: ["#3bff00"],
    title: {
      text: "Inmersión 2023 AJR",
    },
    xaxis: {
      categories: monthNames,

      labels: {
        show: true,
        rotate: 0, // Rotate labels for better readability
      },
    },
  };

  chart = new ApexCharts(document.querySelector("#chart"), options);
  chart.render();

  // Update additional UI elements

  const showDays = document.querySelector("#dias");
  showDays.innerHTML = `Dias inmersados: ${daysImmersed} / ${daysPassed}`;

  const showPointsButton = document.querySelector("#btn-points");
  showPointsButton.addEventListener("click", function () {
    options.dataLabels.enabled = !options.dataLabels.enabled;
    chart.updateOptions(options);
  });

  const toggleCircle = document.querySelector("#btn-circle");
  toggleCircle.addEventListener("click", function () {
    options.plotOptions.heatmap.radius =
      options.plotOptions.heatmap.radius === 0 ? 30 : 0;
    chart.updateOptions(options);
  });
}
