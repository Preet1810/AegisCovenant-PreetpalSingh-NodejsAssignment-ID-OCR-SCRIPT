export const adharToText=(text) => {
    const idType="ADHAR CARD"

    const idNumber=text.match(/\d{4} \d{4} \d{4}/)? text.match(/\d{4} \d{4} \d{4}/)[0]:null;
    const gender=(text.match(/MALE|FEMALE|Male|Female/)||[null])[0];
    const name=(text.match(/[A-Z][a-z]+\s[A-Z][a-z]+/)||[null])[0];

    let dob=''
    if (text.match(/Year of Birth/g)) {
        dob=(text.match(/:\s(\d{4})/)||[null])[1];
    } else {
        dob=(text.match(/\d{2}\/\d{2}\/\d{4}/)||[null])[0];
    }
    const result={
        idType,
        idNumber,
        info: {
            name,
            gender,
            dob
        }
    };
    return result
}