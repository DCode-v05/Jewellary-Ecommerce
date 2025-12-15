export const slugify = (text: string) =>{
    return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}