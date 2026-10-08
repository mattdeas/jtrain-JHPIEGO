import React, { useEffect, useState } from 'react';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import { utilConfigConstantValueByName } from '../utils/utils';
import { Chart } from "react-google-charts";
import { Legend, CircularLoader } from '@dhis2/ui';

/**
 * ReportOverview
 * Home page dashboard: headline totals (trainees enrolled, courses held, trainees attending)
 * and charts for enrolment by sex, trainings per year, trainees per cadre, trainings per
 * partner/year and trainings per district (overall and per year).
 *
 * Each fetch* function loads one dataset via the DHIS2 analytics or events API and stores it
 * with the setter it's given; failures fall back to 0 / [] and the chart is simply hidden.
 * NOTE: several queries still use hardcoded Sierra Leone IDs and fixed years (2014-2024).
 */
export const ReportOverview = () => {
    const engine = useDataEngine();
    
    // Shared flag - cleared by whichever fetch finishes first, so later charts may still be filling in
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

    // TEIs of a given type in an org unit (IDs only) - used for counts
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

    // Events for a program in an org unit
    const qryEvents = {
        events: {
            resource: 'events',
            params: ({ ou, program }) => ({
                ou: ou,
                program: program,
            }),
        },
    };

    // All trainees (drives "Total Trainees Enrolled")
    const { loading: loading1, error: error1, data: dataStaff } = useDataQuery(qryTEI, {
        variables: {
            ou: defStaffOrgUnitId,
            trackedEntityType: defStaffType,
        },
    });

    // All courses (loaded but not displayed)
    const { loading: loading2, error: error2, data: dataCourses } = useDataQuery(qryTEI, {
        variables: {
            ou: defCourseOrgUnitId,
            trackedEntityType: defCourseType,
        },
    });

    // Trainee events (loaded but not displayed)
    const { loading: loading3, error: error3, data: dataEvents } = useDataQuery(qryEvents, {
        variables: {
            ou: defStaffOrgUnitId,
            program: defStaffProgId,
        },
    });

    const [analyticsData, setAnalyticsData] = useState(null);
    const [TPY, setTPY] = useState(0);
    const [TrainingTotal, setTrainingTotal] = useState(0);
    const [TrainingTotalDesignation, setTrainingTotalDesignation] = useState(null);

    // Single analytics value for an indicator (dimension 'dx:<id>') in 2024 - used for enrolees by sex
    const fetchAnalyticsData = async (dimension, setVariable) => {
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

    //https://dhis2.sl.jhpiego.org/api/29/analytics/events/aggregate/vtSLYBYufMn.json?dimension=ou:Esaneu7V7rq&dimension=pe:2024&dimension=C6BqK9IAR7I.dvXhBHwjKJP&stage=C6BqK9IAR7I&displayProperty=NAME&totalPages=false&outputType=EVENT

    // Trainee events in 2024 broken down by designation/cadre, sorted largest first (hardcoded IDs)
    const fetchTrainingStaffTotalbyDesignation = async (setVariable) => {
        const query = {
            analytics: {
                resource: 'analytics/events/aggregate/vtSLYBYufMn',
                params: {
                    dimension: [
                        'ou:Esaneu7V7rq',
                        'pe:2024',
                        'C6BqK9IAR7I.dvXhBHwjKJP'
                    ],
                    stage: 'C6BqK9IAR7I',
                    displayProperty: 'NAME',
                    totalPages: 'false',
                    outputType: 'EVENT'
                }
            }
        };
    
        try {
            const result = await engine.query(query);
    
            // Transform the data
            const transformedData = [
                ["Designation", "Total"],
                ...result.analytics.rows.map(row => [row[0], parseInt(row[3], 10)])
            ];

            // Sort the data by the total count in descending order
        const sortedData = [
            transformedData[0], // Keep the header
            ...transformedData.slice(1).sort((a, b) => b[1] - a[1])
        ];
    
            setVariable(sortedData);
    
        } catch (err) {
            console.error('Error fetching data:', err);
            setVariable(0); // Set the variable to 0 in case of an error
        } finally {
            setLoading(false);
        }
    };

    // Total trainee events ("Total Trainees attending Events"). Note: takes the earliest year's row
    // after sorting, not a sum across years.
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
    
            // Sort the rows by the 'pe' dimension (assuming it's the second column and contains years)
            const sortedRows = result.analytics.rows.sort((a, b) => {
                const yearA = parseInt(a[1], 10);
                const yearB = parseInt(b[1], 10);
                return yearA - yearB;
            });
    
            
            setVariable(sortedRows[0][2]);  
        } catch (err) {
            console.error(`Error fetching data:`, err);
            setVariable(0); // Set the variable to 0 in case of an error
        } finally {
            setLoading(false);
        }
    };

    // Course events counted per year per partner (data element hGGDYuGuVeX) -> [[Year, partner1, ...], ...]
    const fetchTrainingsByPartner = async (setVariable) => {
        const query = {
            events: {
                resource: 'events',
                params: {
                    orgUnit: 'Esaneu7V7rq',
                    program: 'Lw1g7haLUd9',
                    fields: 'eventDate,dataValues[dataElement,value],orgUnitName',
                    pageSize: 10000
                }
            }
        };
    
        try {
            const result = await engine.query(query);
    
            // Access the events array correctly
            const events = result.events.events;
    
            // Check if events is defined and is an array
            if (!events || !Array.isArray(events)) {
                setVariable([]);
                return;
            }
    
            // Process the result to get the breakdown of 'hGGDYuGuVeX' per year
            const breakdown = events.reduce((acc, event) => {
                const year = new Date(event.eventDate).getFullYear();
                const partnerValue = event.dataValues.find(dv => dv.dataElement === 'hGGDYuGuVeX')?.value;
    
                if (partnerValue) {
                    if (!acc[year]) {
                        acc[year] = {};
                    }
                    if (!acc[year][partnerValue]) {
                        acc[year][partnerValue] = 0;
                    }
                    acc[year][partnerValue]++;
                }
    
                return acc;
            }, {});
    
            // Get all unique partner names
            const partnerNames = Array.from(new Set(events.flatMap(event => 
                event.dataValues.filter(dv => dv.dataElement === 'hGGDYuGuVeX').map(dv => dv.value)
            )));
    
            // Format the data into the desired structure
            const formattedData = [["Year", ...partnerNames]];
            for (const year in breakdown) {
                const row = [year];
                for (const partner of partnerNames) {
                    row.push(breakdown[year][partner] || 0);
                }
                formattedData.push(row);
            }
    
            setVariable(formattedData);
    
        } catch (err) {
            setVariable([]); // Set the variable to an empty array in case of an error
        } finally {
            setLoading(false);
        }
    };

    // Unused here
    const ORG_UNITS_QUERY = {
        orgUnits: {
            resource: 'organisationUnits',
            params: {
                paging: false,
            },
        },
    };

    // Course events counted per district. Location values are org unit paths; the last ID is
    // looked up to get the district name -> [[District, Total], ...]
    const fetchTrainingsPerDistrict = async (setVariable) => {
    const eventsQuery = {
        events: {
            resource: 'events',
            params: {
                orgUnit: 'Esaneu7V7rq',
                program: 'Lw1g7haLUd9',
                fields: 'eventDate,dataValues[dataElement,value],orgUnitName',
                pageSize: 10000
            }
        }
    };

    try {
        const result = await engine.query(eventsQuery);
        console.log('Fetched Events Data1:', result);

        // Access the events array correctly
        const events = result.events.events;
        console.log('Events Array1:', events);

        // Check if events is defined and is an array
        if (!events || !Array.isArray(events)) {
            console.error('Invalid events data:', events);
            setVariable([]);
            return;
        }

        // Extract district IDs from Pe5Lkrbvnos values
        const districtIds = Array.from(new Set(events.flatMap(event => 
            event.dataValues.filter(dv => dv.dataElement === 'Pe5Lkrbvnos').map(dv => {
                const parts = dv.value.split('/');
                return parts[parts.length - 1];
            })
        )));

        // Fetch district names using orgunitsQuery
        const orgunitsQuery = {
            orgUnits: {
                resource: 'organisationUnits',
                params: {
                    filter: `id:in:[${districtIds.join(',')}]`,
                    fields: 'id,displayName'
                }
            }
        };

        const orgUnitsResult = await engine.query(orgunitsQuery);

        // Map district IDs to names
        const districtIdToName = orgUnitsResult.orgUnits.organisationUnits.reduce((acc, orgUnit) => {
            acc[orgUnit.id] = orgUnit.displayName;
            return acc;
        }, {});

        // Process the result to get the total number of trainings per district
        const districtTrainings = events.reduce((acc, event) => {
            const districtValue = event.dataValues.find(dv => dv.dataElement === 'Pe5Lkrbvnos')?.value;
            if (districtValue) {
                const parts = districtValue.split('/');
                const districtId = parts[parts.length - 1];
                const districtName = districtIdToName[districtId];

                if (districtName) {
                    if (!acc[districtName]) {
                        acc[districtName] = 0;
                    }
                    acc[districtName]++;
                }
            }

            return acc;
        }, {});

        // Format the data into the desired structure
        const formattedData = [["District", "Total Trainings"]];
        for (const district in districtTrainings) {
            formattedData.push([district, districtTrainings[district]]);
        }

        setVariable(formattedData);

    } catch (err) {
        console.error('Error fetching events data:', err);
        setVariable([]); // Set the variable to an empty array in case of an error
    } finally {
        setLoading(false);
    }
};

// Same as above, split by year -> [[Year, district1, district2, ...], ...]
const fetchTrainingsPerDistrictPerYear = async (setVariable) => {
    const eventsQuery = {
        events: {
            resource: 'events',
            params: {
                orgUnit: 'Esaneu7V7rq',
                program: 'Lw1g7haLUd9',
                fields: 'eventDate,dataValues[dataElement,value],orgUnitName',
                pageSize: 10000
            }
        }
    };

    try {
        const result = await engine.query(eventsQuery);
        console.log('Fetched Events Data:', result);

        // Access the events array correctly
        const events = result.events.events;
        console.log('Events Array:', events);

        // Check if events is defined and is an array
        if (!events || !Array.isArray(events)) {
            console.error('Invalid events data:', events);
            setVariable([]);
            return;
        }

        // Extract district IDs from Pe5Lkrbvnos values
        const districtIds = Array.from(new Set(events.flatMap(event => 
            event.dataValues.filter(dv => dv.dataElement === 'Pe5Lkrbvnos').map(dv => {
                const parts = dv.value.split('/');
                return parts[parts.length - 1];
            })
        )));
        console.log('District IDs:', districtIds);

        // Fetch district names using orgunitsQuery
        const orgunitsQuery = {
            orgUnits: {
                resource: 'organisationUnits',
                params: {
                    filter: `id:in:[${districtIds.join(',')}]`,
                    fields: 'id,displayName',
                    pageSize: 10000
                }
            }
        };

        const orgUnitsResult = await engine.query(orgunitsQuery);
console.log('Fetched Org Units Data:', orgUnitsResult);

// Access the organisationUnits array correctly
const organisationUnits = orgUnitsResult.orgUnits.organisationUnits;
console.log('Organisation Units Array:', organisationUnits);

// Map district IDs to names
const districtIdToName = organisationUnits.reduce((acc, orgUnit) => {
    acc[orgUnit.id] = orgUnit.displayName;
    return acc;
}, {});
console.log('District ID to Name Map:', districtIdToName);

        // Process the result to get the total number of trainings per district per year
        const districtTrainings = events.reduce((acc, event) => {
            const year = new Date(event.eventDate).getFullYear();
            const districtValue = event.dataValues.find(dv => dv.dataElement === 'Pe5Lkrbvnos')?.value;

            if (districtValue) {
                const parts = districtValue.split('/');
                const districtId = parts[parts.length - 1];
                const districtName = districtIdToName[districtId];

                if (districtName) {
                    if (!acc[year]) {
                        acc[year] = {};
                    }
                    if (!acc[year][districtName]) {
                        acc[year][districtName] = 0;
                    }
                    acc[year][districtName]++;
                }
            }

            return acc;
        }, {});

        console.log('District Trainings per year:', districtTrainings);

        // Get all unique district names
        const districtNames = Array.from(new Set(Object.values(districtIdToName)));

        // Format the data into the desired structure
        const formattedData = [["Year", ...districtNames]];
        for (const year in districtTrainings) {
            const row = [year];
            for (const district of districtNames) {
                row.push(districtTrainings[year][district] || 0);
            }
            formattedData.push(row);
        }

        setVariable(formattedData);
        console.log('Formatted Data:', formattedData);

    } catch (err) {
        console.error('Error fetching events data:', err);
        setVariable([]); // Set the variable to an empty array in case of an error
    } finally {
        setLoading(false);
    }
};

    // Course events per year (2014-2024) for the bar chart, and their sum for "Total Courses Held"
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
                    outputType: 'EVENT',
                    pageSize: 10000
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
            console.log('Total Training Events:', totalTrainingEvents);
            setTotalTrainingEvents(totalTrainingEvents);
    
            setVariable(datatrainingsperyear);
            console.log('Transformed  Data:', datatrainingsperyear);
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
    const [TPYP, setTPYP] = useState(null);
    const [TrainingsPerDistrict, setTrainingsPerDistrict] = useState(null);
    const [TrainingsPerDistrictYear, setTrainingsPerDistrictYear] = useState(null);

    
    // Kick off all dashboard fetches once on mount. (The TPY/TrainingTotal logs read state
    // before the fetches finish, so they always show initial values.)
    useEffect(() => {
        console.log('Fetching analytics data');
        console.log(defIndTotUnk, defIndTotMal, defIndTotFem);
        fetchAnalyticsData('dx:'+ defIndTotUnk, setTotU); //Unknown
        fetchAnalyticsData('dx:'+ defIndTotMal, setTotM); //Male
        fetchAnalyticsData('dx:'+ defIndTotFem, setTotF); //Female
        fetchTrainingsPerYear(setTPY);
        console.log('TPY', TPY);
        if (Array.isArray(TPY) && TPY.length > 1) {
            const totalTrainingEvents = TPY.slice(1).reduce((sum, row) => sum + row[1], 0);
            setTotalTrainingEvents(totalTrainingEvents);
            console.log('Total Training Events:', totalTrainingEvents);
        }

        fetchTrainingsStaffTotal(setTrainingTotal);
        console.log('training total', TrainingTotal);
        fetchTrainingStaffTotalbyDesignation(setTrainingTotalDesignation);
        console.log('training total designation', TrainingTotalDesignation);
        fetchTrainingsByPartner(setTPYP)
        console.log('trainings by partner', TPYP);
        fetchTrainingsPerDistrict(setTrainingsPerDistrict);
        //setTotT = totF + totM + totU;
        console.log('trainingsperdistrict', TrainingsPerDistrict);
        fetchTrainingsPerDistrictPerYear(setTrainingsPerDistrictYear);
        console.log('trainingsperdistrictyear', TrainingsPerDistrictYear);
    }, []);


    // Enrolees by sex chart data
    const data = [
        ["", "Total", "Female", "Male", "Unknown"],
        ["Total Enrollees", totF+totM+totU, totF, totM,totU],
      ];

    // Chart options for each chart below
    const options = {
        chart: {
            title: "Trainees Enrolled",
            subtitle: "Total Trained overall since inception",
        },
        
      };

    

      const optionsTPY = {
        chart: {
            title: "Training Events per year",
        },
        chartArea: { width: "50%" },
        hAxis: {
          title: "Year",
        },
        vAxis: {
          title: "Training Events",
        },
        legend: { position: "none" },
      };

      const optionsDesignation = {
        chart: {
            title: "Trainees per Cadre",
        },
        chartArea: { width: "50%" },
        hAxis: {
          title: "Cadre",
        },
        vAxis: {
          title: "Training Events",
        },
        legend: { position: "none" },
      };
    
      const optionsPartnersYear = {
        chart: {
            title: "Trainings per Partner / Year",
        },
        chartArea: { width: "50%" },
        hAxis: {
          title: "Year",
        },
        vAxis: {
          title: "Training Events",
        },
        
      };

      
      const optionsPerDistrict = {
        chart: {
            title: "Trainings per District Overall",
        },
        chartArea: { width: "50%" },
        hAxis: {
          title: "Districts",
        },
        vAxis: {
          title: "Training Events",
        },
        legend: { position: "none" },
      };

      const optionsPerDistrictYear = {
        chart: {
            title: "Trainings per District Overall",
        },
        chartArea: { width: "50%" },
        hAxis: {
          title: "Districts",
        },
        vAxis: {
          title: "Training Events",
        },
        
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

    // Charts crash on empty/invalid data (failed fetches set 0 or []), so only render when there are data rows
    const hasRows = (d) => Array.isArray(d) && d.length > 1;

    if (loading1 || loading2 || loading3 || loading) return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <CircularLoader small />
            <span>Loading...</span>
        </div>
    );
    if (error1 || error2 || error3 || error) return <span>Error1: {error?.message || error1?.message || error2?.message || error3?.message}</span>;

    return (
        <div>
            {/* Headline totals */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', overflowX: 'auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', flex: '1 1 auto', minWidth: '200px' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        fontWeight: 'bold',
                        fontSize: '2em',
                        borderRadius: '10px',
                        backgroundColor: '#f0f0f0',
                        textAlign: 'center'
                    }}>
                        {dataStaff?.instances?.trackedEntityInstances?.length ?? 0}
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '1.2em' }}>Total Trainees Enrolled</p>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '20px', flex: '1 1 auto', minWidth: '200px' }}>
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
                <div style={{ textAlign: 'center', marginBottom: '20px', flex: '1 1 auto', minWidth: '200px' }}>
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
            {/* Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ marginTop: '10px', fontSize: '1.2em' }}>Total Trainees attending Events</p>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px', overflowX: 'auto' }}>
                    <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                        {hasRows(data) && (
                            <Chart
                                chartType="Bar"
                                width="100%"
                                height="400px"
                                data={data}
                                options={options}
                            />
                        )}
                    </div>
                    <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                        {hasRows(TPY) && (
                            <Chart
                                chartType="Bar"
                                width="100%"
                                height="400px"
                                data={TPY}
                                options={optionsTPY}
                            />
                        )}
                    </div>
                    <div style={{ flex: '1 1 auto', minWidth: '200px' }}>
                        {hasRows(TrainingTotalDesignation) && (
                            <Chart
                                chartType="Bar"
                                width="100%"
                                height="400px"
                                data={TrainingTotalDesignation}
                                options={optionsDesignation}
                            />
                        )}
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {hasRows(TPYP) && (
                        <Chart
                            chartType="Bar"
                            width="100%"
                            height="400px"
                            data={TPYP}
                            options={optionsPartnersYear}
                        />
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {hasRows(TrainingsPerDistrict) && (
                        <Chart 
                            chartType="Bar"
                            width="100%"
                            height="400px"
                            data={TrainingsPerDistrict}
                            options={optionsPerDistrict}
                        />
                    )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {hasRows(TrainingsPerDistrictYear) && (
                        <Chart 
                            chartType="Bar"
                            width="100%"
                            height="400px"
                            data={TrainingsPerDistrictYear}
                            options={optionsPerDistrictYear}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}