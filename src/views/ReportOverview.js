import React, { useEffect, useState } from 'react';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import { utilConfigConstantValueByName } from '../utils/utils';
import { Chart } from "react-google-charts";
import { Legend } from '@dhis2/ui';

export const ReportOverview = () => {
    const engine = useDataEngine();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [TotalTrainingEvents, setTotalTrainingEvents] = useState(0);

    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defStaffType = utilConfigConstantValueByName('TEITypeStaff');
    const defCourseType = utilConfigConstantValueByName('TEITypeCourse');
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram');
    const defStaffProgCourseId = utilConfigConstantValueByName('StaffProgramCourse');
    const defIndTotFem = utilConfigConstantValueByName('IndicatorTotalFemaleTrainee');
    const defIndTotMal = utilConfigConstantValueByName('IndicatorTotalMaleTrainee');
    const defIndTotUnk = utilConfigConstantValueByName('IndicatorTotalUnknownTrainee');
    const defCourseProgStage = utilConfigConstantValueByName('CourseProgramStageId');
    const defCourseProgramCourseName = utilConfigConstantValueByName('CourseProgramAttributeCourseName');
    const defCourseProgram = utilConfigConstantValueByName('CourseProgram');

    const qryTEI = {
        instances: {
            resource: 'trackedEntityInstances',
            params: ({ ou, trackedEntityType }) => ({
                ou: ou,
                trackedEntityType: trackedEntityType,
                fields: ['trackedEntityInstance'],
                paging: 'false',
                pageSize: 10000,
            }),
        },
    };

    const qryEvents = {
        events: {
            resource: 'events',
            params: ({ ou, program }) => ({
                ou: ou,
                program: program,
            }),
        },
    };

    const { loading: loading1, error: error1, data: dataStaff } = useDataQuery(qryTEI, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
        },
    });

    const { loading: loading2, error: error2, data: dataCourses } = useDataQuery(qryTEI, {
        variables: {
            ou: defCourseOrgUnitId,
            trackedEntityType: defCourseType,
        },
    });

    const { loading: loading3, error: error3, data: dataEvents } = useDataQuery(qryEvents, {
        variables: {
            ou: defStaffOrgUnitId,
            program: defStaffProgId,
        },
    });

    const [analyticsData, setAnalyticsData] = useState(null);
    const [TPY, setTPY] = useState(0);
    const [TrainingTotal, setTrainingTotal] = useState(0);

    const fetchAnalyticsData = async (dimension, setVariable) => {
        console.log('Fetching analytics data for dimension:', dimension);
        const query = {
            analytics: {
                resource: 'analytics',
                params: {
                    dimension: dimension,
                    filter: 'pe:2024',
                    aggregationType: 'COUNT',
                },
            },
        };
    
        try {
            const result = await engine.query(query);
            const value = parseInt(result.analytics.rows[0][1], 10); // Convert the value to an integer
            setVariable(value);

        } catch (err) {
            console.error(`Error fetching data for dimension ${dimension}:`, err);
            setVariable(0); // Set the variable to null in case of an error
        } finally {
            setLoading(false);
        }
    };

    


    const fetchTrainingsStaffTotal = async (setVariable) => {

        //https://dhis2.sl.jhpiego.org/api/29/analytics/events/aggregate/vtSLYBYufMn.json?dimension=ou:Esaneu7V7rq&dimension=pe:2014;2015;2016;2017;2018;2019;2020;2021;2022;2023;2024&stage=C6BqK9IAR7I&displayProperty=NAME&totalPages=false&outputType=EVENT

        const query = {
            analytics: {
                resource: 'analytics/events/aggregate/' + defStaffProgId,
                params: {
                    dimension: [
                        'ou:' + defStaffOrgUnitId,
                        'pe:2014;2015;2016;2017;2018;2019;2020;2021;2022;2023;2024'
                    ],
                    stage: defStaffProgCourseId,
                    displayProperty: 'NAME',
                    totalPages: 'false',
                    outputType: 'EVENT'
                }
            }
        };
    
        try {
            const result = await engine.query(query);
            console.log('result', result);
    
            // Sort the rows by the 'pe' dimension (assuming it's the second column and contains years)
            const sortedRows = result.analytics.rows.sort((a, b) => {
                const yearA = parseInt(a[1], 10);
                const yearB = parseInt(b[1], 10);
                console.log(`Comparing ${yearA} and ${yearB}`);
                return yearA - yearB;
            });
    
            
            console.log('Total Trained = ', sortedRows);
            console.log('Total Trained = ', sortedRows[0][2]);
            setVariable(sortedRows[0][2]);  
        } catch (err) {
            console.error(`Error fetching data:`, err);
            setVariable(0); // Set the variable to 0 in case of an error
        } finally {
            setLoading(false);
        }
    };


    const fetchTrainingsPerYear = async (setVariable) => {
        const query = {
            analytics: {
                resource: 'analytics/events/aggregate/' + defCourseProgram,
                params: {
                    dimension: [
                        'ou:' + defStaffOrgUnitId,
                        'pe:2014;2015;2016;2017;2018;2019;2020;2021;2022;2023;2024'
                    ],
                    filter: defCourseProgStage + "." + defCourseProgramCourseName,
                    stage: defCourseProgStage,
                    displayProperty: 'NAME',
                    totalPages: 'false',
                    outputType: 'EVENT'
                }
            }
        };
    
        try {
            const result = await engine.query(query);
            console.log('result', result);
    
            // Sort the rows by the 'pe' dimension (assuming it's the second column and contains years)
            const sortedRows = result.analytics.rows.sort((a, b) => {
                const yearA = parseInt(a[1], 10);
                const yearB = parseInt(b[1], 10);
                console.log(`Comparing ${yearA} and ${yearB}`);
                return yearA - yearB;
            });
    
            const datatrainingsperyear = [
                ["Year", "Total"],
                ...sortedRows.map(row => [row[1], parseInt(row[2], 10)])
            ];

            const totalTrainingEvents = sortedRows.reduce((sum, row) => sum + parseInt(row[2], 10), 0);

            setTotalTrainingEvents(totalTrainingEvents);
    
            setVariable(datatrainingsperyear);
            console.log('Transformed Data:', datatrainingsperyear);
        } catch (err) {
            console.error(`Error fetching data:`, err);
            setVariable(0); // Set the variable to 0 in case of an error
        } finally {
            setLoading(false);
        }
    };

    const [totM, setTotM] = useState(0);
    const [totF, setTotF] = useState(0);
    const [totU, setTotU] = useState(0);
    const [totT, setTotT] = useState(0);


    
    useEffect(() => {
        console.log('Fetching analytics data');
        console.log(defIndTotUnk, defIndTotMal, defIndTotFem);
        fetchAnalyticsData('dx:'+ defIndTotUnk, setTotU); //Unknown
        fetchAnalyticsData('dx:'+ defIndTotMal, setTotM); //Male
        fetchAnalyticsData('dx:'+ defIndTotFem, setTotF); //Female
        fetchTrainingsPerYear(setTPY);
        fetchTrainingsStaffTotal(setTrainingTotal);
        console.log('training total', TrainingTotal);
        //setTotT = totF + totM + totU;
    }, []);


    const data = [
        ["", "Total", "Female", "Male", "Unknown"],
        ["Total Enrollees", totF+totM+totU, totF, totM,totU],
      ];

    const options = {
        chart: {
            title: "Trainees Enrolled",
            subtitle: "Total Trained overall since inception",
        },
        
      };

      const piedata = [
       [ "Task", "Hours per Day"],
       ["Unknown", totU],
  ["Female", totF],
  ["Male", totM],
      ];

      const pieoptions = {
        title: "My Daily Activities",
      };

      
      const optionsTPY = {
        title: "Training Events per Year",
        chartArea: { width: "50%" },
        hAxis: {
          title: "Year",
        },
        vAxis: {
          title: "Training Events",
        },
        legend: { position: "none" },
      };
    


    // var options2 = {
    //     title: 'Chess opening moves',
    //     width: 900,
    //     legend: { position: 'none' },
    //     chart: { title: 'Chess opening moves',
    //              subtitle: 'popularity by percentage' },
    //     bars: 'horizontal', // Required for Material Bar Charts.
    //     axes: {
    //       x: {
    //         0: { side: 'top', label: 'Percentage'} // Top x-axis.
    //       }
    //     },
    //     bar: { groupWidth: "90%" }
    //   };

    if (loading1 || loading2 || loading3 || loading) return <span>Loading...</span>;
    if (error1 || error2 || error3 || error) return <span>Error: {error?.message || error1?.message || error2?.message || error3?.message}</span>;

    return (
        <div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
                display: 'inline-block',
                padding: '10px 20px',
                fontWeight: 'bold',
                fontSize: '2em',
                borderRadius: '10px',
                backgroundColor: '#f0f0f0',
                textAlign: 'center'
            }}>
                {dataStaff.instances.trackedEntityInstances.length}
            </div>
            <p style={{ marginTop: '10px', fontSize: '1.2em' }}>Total Trainees Enrolled</p>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
                display: 'inline-block',
                padding: '10px 20px',
                fontWeight: 'bold',
                fontSize: '2em',
                borderRadius: '10px',
                backgroundColor: '#f0f0f0',
                textAlign: 'center'
            }}>
                {TotalTrainingEvents}
            </div>
            <p style={{ marginTop: '10px', fontSize: '1.2em' }}>Total Courses Held</p>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{
                display: 'inline-block',
                padding: '10px 20px',
                fontWeight: 'bold',
                fontSize: '2em',
                borderRadius: '10px',
                backgroundColor: '#f0f0f0',
                textAlign: 'center'
            }}>
                {TrainingTotal}
            </div>
            <p style={{ marginTop: '10px', fontSize: '1.2em' }}>Total Trainees attending Events</p>
        </div>
        </div>
            <div style={{paddingRight: 20}}>
                <Chart
                chartType="Bar"
                width="100%"
                height="400px"
                data={data}
                options={options}
                />

                <Chart
                    chartType="PieChart"
                    data={piedata}
                    options={pieoptions}
                    width={"100%"}
                    height={"400px"}
                    />

<Chart
      chartType="Bar"
      width="100%"
      height="400px"
      data={TPY}
      options={optionsTPY}
    />
            </div>
            
        </div>
    );
};