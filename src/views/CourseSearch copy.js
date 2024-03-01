import { useDataQuery, useDataEngine } from '@dhis2/app-runtime'
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui'
import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CourseAdd} from './Course-Add'

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
}

export const CourseSearch = () => {
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [message, setMessage] = useState(localStorage.getItem('message') || '');

    const engine = useDataEngine();


    const { loading: loadingConstants, error: errorConstants, data: dataConstants } = useDataQuery(qryConstants);

    const [dThematicAreaOptions, setDThematicAreaOptions] = useState(null);
    const [dCourseorgunit, setdefaultcourseorgunit] = useState(null);
    const [dCourseProgram, setdefaultcourseprogram] = useState(null);
    const [loadingOptionSets, setLoadingOptionSets] = useState(false);
    const [errorOptionSets, setErrorOptionSets] = useState(null);
    const [dataOptionSets, setDataOptionSets] = useState(null);
    
    useEffect(() => {
        const fetchConstantsAndOptionSets = async () => {
            try {
                const dThematicAreaOptions = findConstantCodeByName('jtrain-thematicarea-optionset', constantsResponse);
                setDThematicAreaOptions(dThematicAreaOptions);
                const dCourseorgunit = findConstantCodeByName('jtrain-defaultcourseorgunit', constantsResponse);
                setdefaultcourseorgunit(dCourseorgunit);
                const dCourseProgram = findConstantCodeByName('jtrain-courseprogram', constantsResponse);
                setdefaultcourseprogram(dCourseProgram);
    
                const optionSetsResponse = await engine.query({
                    optionSets: {
                        resource: `optionSets/${dThematicAreaOptions}`,
                        params: {
                            fields: 'options[name,code]',
                        },
                    },
                });
                setDataOptionSets(optionSetsResponse);
            } catch (error) {
                console.error(error);
            }
        };
    
        fetchConstantsAndOptionSets();
    }, []);

    console.log('dThematicAreaOptions: ' + dThematicAreaOptions);
    console.log('dCourseorgunit: ' + dCourseorgunit);
    console.log('dCourseProgram:' + dCourseProgram);

    const findConstantCodeByName = (name) => {
        if (!dataConstants.data) return 'dataConstants is not populated';
        if (dataConstants.loading) return 'Loading...';
        if (dataConstants.error) return 'Error';
    
        const constant = dataConstants.data.attributes.constants.find(constant => constant.displayName === name);
        if (constant) {
            const code = constant.code.substring(constant.displayName.length + 1); // +1 to exclude the separator
            console.log('Name' + name + ' - Code: ' + code)
            return code;
        } else {
            return 'Not found';
        }
    };


    // useEffect(() => {
    //     if (dataConstants) {
    //         const idThematicAreaOptions = findConstantCodeByName('jtrain-thematicarea-optionset');
    //         setDThematicAreaOptions(idThematicAreaOptions);
    //         const idefaultcourseorgunit = findConstantCodeByName('jtrain-defaultcourseorgunit');
    //         setdefaultcourseorgunit(idefaultcourseorgunit);
    //         const icourseprogram = findConstantCodeByName('jtrain-courseprogram');
    //         setdefaultcourseprogram(icourseprogram);
    //     }
    // }, [dataConstants]);

    // useEffect(() => {
    //     if (dThematicAreaOptions) {
    //         setLoadingOptionSets(true);
    //         setErrorOptionSets(null);
    //         setDataOptionSets(null);

    //         const qryOptionSets = {
    //             attributes: {
    //                 resource: `optionSets/${dThematicAreaOptions}`,
    //                 params: {
    //                     fields: 'options[name,code]',
    //                 },
    //             },
    //         }

    //         useDataQuery(qryOptionSets)
    //             .then(data => {
    //                 setLoadingOptionSets(false);
    //                 setDataOptionSets(data);
    //             })
    //             .catch(error => {
    //                 setLoadingOptionSets(false);
    //                 setErrorOptionSets(error);
    //             });
    //     }
    // }, [dThematicAreaOptions]);

    useEffect(() => {
        localStorage.removeItem('message');
    }, []);

    const reload = () => {
        setMessage('Course added successfully');
        setShowAddCourse(false);
        refetch();
    };
 
    
    if (loadingConstants) return <p>Loading...</p>;
    if (errorConstants) return <p>Error : </p>;

    

    // //const dThematicAreaOptions = findConstantCodeByName('jtrain-thematicarea-optionset');

    // const qryOptionSets = {
    //     attributes: {
    //         resource: `optionSets/${dThematicAreaOptions}`,
    //         params: {
    //             fields: 'options[name,code]',
    //         },
    //     },
    // }

    // const { loading, error, data, refetch } = useDataQuery(query, {
    //     variables: {
    //         ou: dCourseorgunit,
    //         program: dCourseProgram,
    //     },
    // })


    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchTermChange = (event) => {
        setSearchTerm(event.target.value);
    }


    return (
        <div>
            <h1>Search Courses </h1>

            <select placeholder="Thematic Area">
                <option value="">Select Thematic Area</option>
                <option value="">QI</option>
                <option value="">CI</option>
            </select>

            <input type="text" value={searchTerm} onChange={handleSearchTermChange} placeholder="Course Name" />

            <label >
                Start Date:
                <input type="date" />
            </label>

            <label>
                End Date:
                <input type="date" />
            </label>

            <button>Search</button>
            {/* {loading && 'Loading...'}
            {error && error.message}
            {data?.instances?.trackedEntityInstances && (
                <Table>
                    <TableHead>
                        <TableRowHead>
                            <TableCellHead>Thematic Area</TableCellHead>
                            <TableCellHead>Course Name</TableCellHead>
                            <TableCellHead>Course Dates</TableCellHead>
                            <TableCellHead>Open</TableCellHead>
                        </TableRowHead>
                    </TableHead>
                    <TableBody>
                        {data.instances.trackedEntityInstances
                            .filter(item => item.attributes.some(attr => attr.displayName === 'Course Name' && attr.value.toLowerCase().includes(searchTerm.toLowerCase())))
                            .slice(0, 10)
                            .map(
                                ({ trackedEntityInstance, attributes }) => {
                                    const attributesObj = attributes.reduce((obj, item) => {
                                        obj[item.displayName] = item.value;
                                        return obj;
                                    }, {});

                                    return (
                                        <TableRow key={trackedEntityInstance}>
                                            <TableCell>{attributesObj['Course Thematic Area']}</TableCell>
                                            <TableCell>{attributesObj['Course Name']}</TableCell>
                                            <TableCell>{attributesObj['']}</TableCell>
                                            <TableCell>
                                                <Link to={`/courseview/${trackedEntityInstance}`}>View Details</Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                            )}
                    </TableBody>
                    
                </Table>
            )} */}
            <button onClick={() => { setShowAddCourse(true); setMessage(''); }}>Add New Course</button>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                

            {/* {showAddCourse ? (
                <CourseAdd onCancel={() => setShowAddCourse(false)} onSaved={reload} />
            ) : (
                <p>{message}</p>
            )} */}
            </div>
        </div>
    )
}