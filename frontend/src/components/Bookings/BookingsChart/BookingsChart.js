import React from 'react';
import { Bar as BarChart } from 'react-chartjs-2';

const BOOKINGS_BUCKETS = {
  Cheap: {
    min: 0,
    max: 100,
  },
  Normal: {
    min: 100,
    max: 200,
  },
  Expensive: {
    min: 200,
    max: 10000000,
  },
};

const bookingsChart = (props) => {
  const chartData = {
    labels: [],
    datasets: [
      {
        label: 'bookings',
        data: [],
      },
    ],
  };
  for (const bucket in BOOKINGS_BUCKETS) {
    const filteredBookingsCount = props.bookings.reduce((prev, cur) => {
      if (
        cur.event.price > BOOKINGS_BUCKETS[bucket].min &&
        cur.event.price < BOOKINGS_BUCKETS[bucket].max
      ) {
        return prev + 1;
      } else {
        return prev;
      }
    }, 0);
    chartData.labels.push(bucket);
    chartData.datasets[0].data.push(filteredBookingsCount);
    console.log(chartData.datasets[0].data);
  }
  return (
    <div style={{ width: '50%', margin: '0 auto' }}>
      <BarChart
        data={chartData}
        width={100}
        height={500}
        options={{
          scales: {
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
};

export default bookingsChart;
