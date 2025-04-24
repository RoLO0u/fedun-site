import React, { useEffect } from 'react';
import { z } from 'zod';

import { formatDate } from '@/lib/parseData';
import chatSchema from '@/lib/chatSchema';

interface AnalyzedProps {
    json: z.infer<typeof chatSchema>;
}

const Analyzed: React.FC<AnalyzedProps> = ({ json }) => {
    return (<>
        <h1 className="text-2xl font-bold">Analyze Result of "{json.name}"</h1>
        <div>
            <p>
            First message sent: {formatDate(json.messages[0].date)}
            </p>
            <p>
            Last message sent: {formatDate(json.messages[json.messages.length - 1].date)}
            </p>
        </div>
        <div className="flex flex-col gap-4">

        </div>
    </>);
};

export default Analyzed;