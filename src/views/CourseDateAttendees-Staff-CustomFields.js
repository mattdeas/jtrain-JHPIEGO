import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDataQuery, useDataEngine } from '@dhis2/app-runtime';
import { Table, TableHead, TableRow, TableCell, TableBody, InputField, IconCheckmark24, CircularLoader, IconCross24 } from '@dhis2/ui';

//export const CourseDateAttendeesStaffCustomFields = ({event}) => {
    export const CourseDateAttendeesStaffCustomFields = ({eventID}) => {
    //const { id } = useParams();
    
    const [updateStatus, setUpdateStatus] = useState(null);
    const event = eventID;
    const engine = useDataEngine();
    const [programStageData, setProgramStageData] = useState(null);
    const [dataInputTypes, setDataInputTypes] = useState({});
    const [eventData, setEventData] = useState(null);
    const [hasError, setHasError] = useState(false);

    const { loading: eventLoading, error: eventError, data: initialEventData } = useDataQuery({
        event: {
            resource: `events/${event}`,
            params: {
                fields: ['programStage,dataValues[dataElement,value]'],
            },
        },
    });

    useEffect(() => {
        if (initialEventData) {
            setEventData({
                ...initialEventData,
                event: {
                    ...initialEventData.event,
                    dataValues: initialEventData.event.dataValues.map(dv => ({ ...dv, status: 'default' })),
                },
            });
        }
    }, [initialEventData]);

    useEffect(() => {
        if (eventData?.event?.programStage) {
            engine.query({
                programStage: {
                    resource: `programStages/${eventData.event.programStage}`,
                    params: {
                        fields: ['programStageDataElements[dataElement[id,name],sortOrder]'],
                    },
                },
            }).then(data => setProgramStageData(data.programStage));
        }
    }, [engine, eventData]);

    useEffect(() => {
        if (programStageData?.programStageDataElements) {
            programStageData.programStageDataElements.forEach(dataElement => {
                if (!dataElement.dataElement.name.startsWith('jtrain')) {
                    engine.query({
                        dataElement: {
                            resource: `dataElements/${dataElement.dataElement.id}`,
                            params: {
                                fields: ['valueType'],
                            },
                        },
                    }).then(data => setDataInputTypes(prev => ({ ...prev, [dataElement.dataElement.id]: data.dataElement.valueType })));
                }
            });
        }
    }, [engine, programStageData]);

    const handleInputChange = async (dataElementId, newValue) => {
        setUpdateStatus('loading');
        const updatedDataValues = eventData.event.dataValues.map(dv => dv.dataElement === dataElementId ? { ...dv, value: newValue, status: 'loading' } : dv);
        setEventData(prev => ({ ...prev, event: { ...prev.event, dataValues: updatedDataValues } }));

        try {
            await engine.mutate({
                resource: `events/${event}`,
                type: 'update',
                data: { ...eventData.event, dataValues: updatedDataValues.map(dv => ({ dataElement: dv.dataElement, value: dv.value })) },
            });

            setEventData(prev => ({
                ...prev,
                event: {
                    ...prev.event,
                    dataValues: prev.event.dataValues.map(dv => dv.dataElement === dataElementId ? { ...dv, status: 'success' } : dv),
                },
            }));
            setUpdateStatus('success')
        } catch (error) {
            setEventData(prev => ({
                ...prev,
                event: {
                    ...prev.event,
                    dataValues: prev.event.dataValues.map(dv => dv.dataElement === dataElementId ? { ...dv, status: 'error' } : dv),
                },
            }));
            setUpdateStatus('error')
        }
    };
    if (eventLoading) return <div><span><CircularLoader /> Loading ...</span></div>;
    const sortedDataElements = programStageData?.programStageDataElements?.sort((a, b) => a.sortOrder - b.sortOrder);

    return (
        <div style={{ overflow: 'auto', maxHeight: '500px' }}>
            <Table>
                <TableHead>
                    <TableRow>
                        {sortedDataElements?.map((dataElement) => (
                            !dataElement.dataElement.name.startsWith('jtrain') && (
                                <TableCell key={dataElement.dataElement.id}>
                                    {dataElement.dataElement.name}
                                </TableCell>
                            )
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                    {sortedDataElements?.map((dataElement) => {
                            const dataValue = eventData?.event?.dataValues?.find((dv) => dv.dataElement === dataElement.dataElement.id);
                            return (
                                !dataElement.dataElement.name.startsWith('jtrain') && (
                                    <TableCell key={dataElement.dataElement.id}>
                                    <div style={{ 
                                        backgroundColor: dataValue?.status === 'success' ? 'lightgreen' : dataValue?.status === 'error' ? 'lightcoral' : 'white',
                                        boxSizing: 'border-box' 
                                    }}>
                                        <InputField
                                            type={dataInputTypes[dataElement.dataElement.id] === 'NUMBER' ? 'number' : 'text'}
                                            value={dataValue?.value}
                                            onChange={({ value }) => handleInputChange(dataElement.dataElement.id, value)}
                                            inputWidth="200px"
                                            style={{ backgroundColor: 'transparent' }}

                                        />
                                    </div>
                                    </TableCell>
                                )
                            );
                        })}
                        <TableCell>
                            {updateStatus === 'loading' && <CircularLoader />}
                            {updateStatus === 'success' && <IconCheckmark24 color='green' />}
                            {updateStatus === 'error' && <IconCross24 color='red' />}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
};