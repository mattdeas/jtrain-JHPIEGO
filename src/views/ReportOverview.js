import React, { useEffect, useState } from 'react';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import { utilConfigConstantValueByName } from '../utils/utils';
import { Chart } from "react-google-charts";

export const ReportOverview = () => {
    const engine = useDataEngine();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const defStaffOrgUnitId = utilConfigConstantValueByName('DefaultStaffOrgUnit');
    const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
    const defStaffType = utilConfigConstantValueByName('TEITypeStaff');
    const defCourseType = utilConfigConstantValueByName('TEITypeCourse');
    const defStaffProgId = utilConfigConstantValueByName('StaffProgram');
    const defIndTotFem = utilConfigConstantValueByName('IndicatorTotalFemaleTrainee');
    const defIndTotMal = utilConfigConstantValueByName('IndicatorTotalMaleTrainee');
    const defIndTotUnk = utilConfigConstantValueByName('IndicatorTotalUnknownTrainee');

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
        //setTotT = totF + totM + totU;
    }, []);

    // const data = [
    //     ["Total", "Female", "Male", "Unknown"],
    //     ["Training Totals", totF, totM, totU],
    // ];

    // const options = {
    //     chart: {
    //         title: "Trainees Enrolled",
    //         subtitle: "Total Trained overall since inception",
    //     },
    //     bars: 'vertical',
        
    //     hAxis: {
    //       title: 'Total Trainees',
    //     },
    //     axes: {
    //         y: {
    //         0: { side: "right" },
    //         },
    //     },
    // };

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
            <p>Total number of trainees: {dataStaff.instances.trackedEntityInstances.length}</p>
            <p>Total number of courses: {dataCourses.instances.trackedEntityInstances.length}</p>
            <p>Total number of trainees attending training events: {dataEvents.events.events.length}</p>
            <p>{totF} - {totM} - {totT}  - {totU}</p>
            <div style={{paddingRight: 20}}>
                <Chart
                chartType="Bar"
                width="100%"
                height="400px"
                data={data}
                options={options}
                />
            </div>
            
        </div>
    );
};