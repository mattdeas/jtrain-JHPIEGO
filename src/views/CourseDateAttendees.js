import React from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { StaffSearchAttendees } from './StaffSearchAttendees';

export const CourseDateAttendees = ({ eventID }) => {
    if (!eventID || eventID.length === 0) {
        return <div>Please provide an event ID.</div>;
    }

    const { loading, error, data } = useDataQuery({
        event: {
            resource: 'events',
            id: `${eventID}`,
            params: {
                fields: ['relationships[*]'],
            },
        },
    });

    const mutation = {
        resource: 'relationships',
        type: 'delete',
        id: "naGx9s8kuZP",
    }

    const [mutate] = useDataMutation(mutation, {
        onComplete: () => {
            window.location.reload();
        },
    });

    if (loading) return <span>Loading...</span>;
    if (error) return <span>Error: {error.message}</span>;
    console.log("data", data)
    return (
        <div>
            <h3>Course Date Attendees</h3>
            <p>Event ID: {eventID}</p>

            <table>
                <thead>
                    <tr>
                        <th>Relationship ID</th>
                        <th>Tracked Entity Instance ID</th>
                    </tr>
                </thead>
                <tbody>
                {eventID && eventID.length > 0 && data && data.event && data.event.relationships && data.event.relationships.map((relationship) => (
    <tr key={relationship.relationship}>
        <td>{relationship.relationship}</td>
        <td>{relationship.to.trackedEntityInstance.trackedEntityInstance}</td>
        <td>
            {/* <button onClick={() => mutate({ id: relationship.relationship })}>
                Delete
            </button> */}
            <button onClick={() => mutate({ id: "naGx9s8kuZP" })}>
                Delete
            </button>
            sdsvs
        </td>
    </tr>
))}
                </tbody>
            </table>

            <StaffSearchAttendees eventID={eventID}/>
        </div>
    );
}