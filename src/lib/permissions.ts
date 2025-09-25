import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = { 
    ...defaultStatements,
    project: ["create", "update", "delete"], 
} as const; 

export const ac = createAccessControl(statement); 

export const admin = ac.newRole({
    project: ["create", "update", "delete"],
    ...adminAc.statements, 
});