import React from 'react';
import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import { StaffSearchAttendees } from './StaffSearchAttendees';
import { CourseAttendee } from './CourseAttendee';


const relationshipQuery = {
    relationships: {
      resource: 'relationships',
      id: ({ id }) => id,
    },
  };

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

    const { dataRel, loadingRel, errorRel } = useDataQuery(relationshipQuery);

    console.log('dataAttendees', data)
    const useDeleteRelationship = (id) => {
        const mutation = {
            resource: 'relationships',
            type: 'delete',
            id: id,
        }
    
        const [mutate] = useDataMutation(mutation, {
            onComplete: () => {
                window.location.reload();
            },
        });
    
        return mutate;
    }
    

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
    {eventID && eventID.length > 0 && dataRel && dataRel.event && dataRel.event.relationships && dataRel.event.relationships.map((relationship) => {
        console.log('dataRel',dataRel)
  const relationshipData = dataRel.relationships[relationship.relationship];
  return relationshipData ? (
    <CourseAttendee 
      key={relationship.relationship}
      relationshipId={relationship.relationship}
      eventID={eventID}
      trackedEntityInstanceId={relationship.to.trackedEntityInstance.trackedEntityInstance}
    />
  ) : null;
})}
    </tbody>
</table>

            <StaffSearchAttendees eventID={eventID}/>
        </div>
    );
}