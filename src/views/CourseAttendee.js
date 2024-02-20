import { useDataQuery, useDataMutation } from '@dhis2/app-runtime';
import {
    Table,
    TableBody,
    TableCell,
    TableCellHead,
    TableHead,
    TableRow,
    TableRowHead,
} from '@dhis2/ui';
import React, { useState } from 'react';

export const CourseAttendee = ({ relationshipId, trackedEntityInstanceId, eventID }) => {
    const mutationDelRelationship = {
        resource: 'relationships',
        type: 'delete',
        id: relationshipId
        
        //event: eventID,
        //trackedEntityInstance: trackedEntityInstanceId,
    }

    const mutationRelationships = {
        resource: 'relationships',
        type: 'delete',
        id: relationshipId,
        data: ({ trackedEntityInstance, eventID, type }) => ({
            relationshipType: type,
            from: {
                event: {
                    event: eventID,
                },
            },
            to: {
                trackedEntityInstance: {
                    trackedEntityInstance: trackedEntityInstance,
                },
            },
            
        }),
    };
    
    

    const mutationUpdateEventRelationship = {
        resource: 'events',
        type: 'update',
        id: eventID,
        data: {
          relationships: {
            // Filter out the relationship you want to remove
            // based on the relationshipId
            remove: [{ id: relationshipId }],
          },
        },
      };
    
      const [mutateDelRelationship] = useDataMutation(mutationDelRelationship, {
        onComplete: () => {
            window.location.reload();
        },
    });

    const [mutateUpdateEventRelationship] = useDataMutation(mutationUpdateEventRelationship, {
        onComplete: () => {
            window.location.reload();
        },
    });

    const handleDelete = async () => {
        try {
            await mutateDelRelationship();
            //await mutateUpdateEventRelationship();
            //await mutationRelationships();
        } catch (error) {
            console.error('Error in handleDelete:', error.message);
        }
    }


    return (
        <div>
        <table>
        <TableRow>
            <TableCell>{relationshipId}</TableCell>
            <TableCell>{trackedEntityInstanceId}</TableCell>
            <TableCell>
                <button onClick={handleDelete}>
                    Delete
                </button>
            </TableCell>
        </TableRow>
        </table>
        </div>
    );
};