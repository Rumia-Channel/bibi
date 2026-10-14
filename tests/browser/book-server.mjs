export const sendBook = (Request, Response, Bytes, Cors = false, Requests) => {
    const Headers = { 'Content-Type': 'application/epub+zip', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
    if(Cors) Object.assign(Headers, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length' });
    const Range = Request.headers.range;
    Requests?.push({ url: Request.url, range: Range || null, cors: Cors, cookie: !!Request.headers.cookie });
    if(Range) {
        const Match = /^bytes=(\d*)-(\d*)$/.exec(Range);
        if(!Match) { Response.writeHead(416, Headers); Response.end(); return; }
        const Start = Match[1] ? Number(Match[1]) : Math.max(0, Bytes.length - Number(Match[2]));
        const End = Match[1] && Match[2] ? Math.min(Number(Match[2]), Bytes.length - 1) : Bytes.length - 1;
        if(Start > End || Start >= Bytes.length) { Response.writeHead(416, Headers); Response.end(); return; }
        Response.writeHead(206, { ...Headers, 'Content-Range': `bytes ${Start}-${End}/${Bytes.length}`, 'Content-Length': End - Start + 1 });
        Response.end(Bytes.subarray(Start, End + 1));
    } else { Response.writeHead(200, { ...Headers, 'Content-Length': Bytes.length }); Response.end(Bytes); }
};
