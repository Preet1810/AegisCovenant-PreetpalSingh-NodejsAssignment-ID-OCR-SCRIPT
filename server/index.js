const express=require('express');
const multer=require('multer');
const tesseract=require('tesseract.js')
const cors=require('cors')
const path=require('path')
const app=express()
const fs=require('fs');
const sharp=require('sharp');
const { match }=require('assert');


app.use(express.static(path.join(__dirname+'/uploads')))

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200
}));

const storage=multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },

    filename: function (req, file, cb) {
        const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9)
        cb(null, file.fieldname+'-'+uniqueSuffix)
    }
})


const upload=multer({ storage: storage })


const adharToText=(text) => {
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


const panToText=(text) => {
    const idType="PAN CARD";
    const idNumber=(text.match(/[A-Z]{5}\d{4}[A-Z]{1}/g)||[null])[0];
    const dob=(text.match(/\d{2}\/\d{2}\/\d{4}/)||[null])[0];
    const indiaToEnd=text.substring(text.indexOf("INDIA")+5)
    const matches=indiaToEnd.match(/\b[A-Z]+\s(?:\w+\s)?[A-Z]+\b/g);
    console.log(matches)
    let name, fatherName;

    if (matches) {
        name=matches[0];
        fatherName=matches[1];
    } else {
        name=null;
        fatherName=null;
    }

    const result={
        idType,
        idNumber,
        info: {
            name,
            dob,
            fatherName
        }
    };
    return result;
};




const deleteFile=(file) => {
    fs.unlink(file, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: err.message });
        }
        console.log("File deleted successfully!");
    });
}



app.post('/imagetotext', upload.single('picture'), async (req, res) => {
    try {
        await sharp(req.file.path)
            .grayscale()
            .sharpen({ sigma: 1, m1: 2, m2: 2 })
            .normalize({ lower: 10, upper: 50 })
            .resize(3000, null, { withoutEnlargement: true }) // resize to a reasonable width for OCR
            .gamma()
            .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
            .toFile("uploads/edited-image.png");

        tesseract.recognize(
            "uploads/edited-image.png",
            ['eng']

        ).then(({ data: { text } }) => {
            console.log(text);
            let result;
            const panreg=/\b(?:INCOME|TAX|Permanent)\b/;

            if (panreg.test(text)) {
                result=panToText(text);
            } else {
                result=adharToText(text);
            }
            deleteFile(req.file.path)
            res.status(201).json({ result, imageToText: text });
        })
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})



try {
    app.listen(3000, () => {
        console.log('App is running on port 3000');
    });
} catch (err) {
    console.error('Error starting server:', err);
}

