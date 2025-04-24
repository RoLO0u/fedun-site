const parseNullish = (value: any | null | undefined): any => {
    if (value === null || value === undefined) {
        return "No data";
    }
    return value;
}

export const formatDate = (date: string | null | undefined): string => {
    return new Date(parseNullish(date)).toLocaleString();
}