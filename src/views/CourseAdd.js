import { useDataQuery, useDataMutation } from '@dhis2/app-runtime'
import { BrowserRouter as Router, Route, Link, Routes, useLocation, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useDataEngine } from '@dhis2/app-runtime';
import {  utilConfigConstantValueByName } from '../utils/utils';
import { IconCross16, IconSave16 } from '@dhis2/ui';

    const qryConstants = {
        // One query object in the whole query
        attributes: {
            // The `attributes` endpoint should be used
            resource: 'constants',
            params: {
                // Paging is disabled
                paging: false,
                // Only the attribute properties that are required should be loaded
                fields: 'id, displayName, code, value',
            },
        },
    };

    const qryProgramFields = {
        program: {
            resource: 'programs',
            id: ({ id }) => id,
            params: {
                fields: ['id', 'name', 'programTrackedEntityAttributes[sortOrder,trackedEntityAttribute[id,name,valueType,mandatory,optionSet[id,name,options[id,code,name,displayName]]]]'],
            },
        },
    };

    const mutation = {
        resource: 'trackedEntityInstances',
        type: 'create',
        data: ({ newEntity }) => newEntity,
    };

    export const CourseAdd = (props) => {
        const { id } = useParams();
        const [message, setMessage] = useState('');
        const [formFields, setFormFields] = useState({});
        const [trackedEntityInstance, setTrackedEntityInstance] = useState(null);
        const engine = useDataEngine();

        const [mutate] = useDataMutation(mutation);
        const [date, setDate] = useState('');

        const handleInputChange = (event) => {
            console.log('is this working')
            const { name, value } = event.target;
            setFormFields(prevFields => ({
                ...prevFields,
                [name]: value,
            }));
        };

        const handleInputChangeSelect = (event) => {
            const { name, value } = event.target;
            setFormFields(prevValues => ({ ...prevValues, [name]: value }));
        };
        
        const defCourseOrgUnitId = utilConfigConstantValueByName('DefaultCourseOrgUnit');
        const defCourseType = utilConfigConstantValueByName('TEITypeCourse');
        const defCourseProgramId = utilConfigConstantValueByName('CourseProgram');

        const handleFormSubmit = async (event) => {
            event.preventDefault();
            console.log('event', event);
        
            // Fetch the program details to get the correct trackedEntityType
            const programDetails = await engine.query({
                program: {
                    resource: `programs/${defCourseProgramId}`,
                    params: {
                        fields: ['trackedEntityType[id]'],
                    },
                },
            });
        
            const trackedEntityType = programDetails.program.trackedEntityType.id;
        
            const newEntity = {
                attributes: data.program.programTrackedEntityAttributes.map(attr => ({
                    attribute: attr.trackedEntityAttribute.id,
                    value: formFields[attr.trackedEntityAttribute.id],
                })),
                orgUnit: defCourseOrgUnitId,
                trackedEntityType: trackedEntityType, // Use the correct trackedEntityType
            };
        
            const createResponse = await engine.mutate({
                resource: 'trackedEntityInstances',
                type: 'create',
                data: newEntity,
            });
        
            const teiId = createResponse.response.importSummaries[0].reference;
        
            const enrollmentData = {
                trackedEntityInstance: teiId,
                program: defCourseProgramId,
                orgUnit: defCourseOrgUnitId,
                enrollmentDate: new Date().toISOString().split('T')[0],
                incidentDate: new Date().toISOString().split('T')[0],
            };
        
            console.log(newEntity);
            await engine.mutate({
                resource: 'enrollments',
                type: 'create',
                data: enrollmentData,
            });
        
            setMessage('Saved successfully');
            props.onSaved();
        };

        

        const { loading: loading1, error1, data } = useDataQuery(qryProgramFields, {
            variables: {
                id: defCourseProgramId,
            },
        });

        const findAttributeValue = (attributeId) => {
            if (trackedEntityInstance) {
                const attribute = trackedEntityInstance.find(attr => attr.attribute === attributeId);
                return attribute ? attribute.value : '';
            } else {
                return '';
            }
        };
        return (
            <div>
                <h1>New Course Details</h1>

                {loading1 && 'Loading...'}

                {error1 && error1.message}

                {data?.program?.programTrackedEntityAttributes && (
                    <form onSubmit={handleFormSubmit}>
                        <table>
                            <tbody>
                                {data.program.programTrackedEntityAttributes.map(({ trackedEntityAttribute }) => (
                                    <tr key={trackedEntityAttribute.id}>
                                        <td>
                                            <label>{trackedEntityAttribute.name}</label>
                                        </td>
                                        <td>
                                            {trackedEntityAttribute.valueType === 'TEXT' ? (
                                                trackedEntityAttribute.optionSet && trackedEntityAttribute.optionSet.options ? (
                                                    <select name={trackedEntityAttribute.id} onChange={handleInputChangeSelect}>
                                                        <option value="">Select...</option>
                                                        {trackedEntityAttribute.optionSet.options.map(option => (
                                                            <option key={option.id} value={option.code}>
                                                                {option.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input type="text" name={trackedEntityAttribute.id} onChange={handleInputChange} />
                                                )
                                            ) : trackedEntityAttribute.valueType === 'DATE' ? (
                                                <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} />
                                            ) : trackedEntityAttribute.valueType === 'NUMBER' ? (
                                                <input type="text" name={trackedEntityAttribute.id} value={findAttributeValue(trackedEntityAttribute.id)} onChange={handleInputChange} />
                                            ) : (
                                                trackedEntityAttribute.valueType
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button type="submit"><IconSave16 /> Save</button>
                        <button type="button" onClick={props.onCancel}><IconCross16 /> Cancel</button>
                        {message && <p>{message}</p>}
                    </form>
                )}
            </div>
        );
    }