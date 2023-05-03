const express=require('express');
const multer=require('multer');
const tesseract=require('tesseract.js');
const cors=require('cors');
const path=require('path');
const fs=require('fs');
const sharp=require('sharp');

const app=express();  // creating an instance of express

app.use(express.static(path.join(__dirname, 'uploads')));  // serving static files from the uploads folder
app.use(cors({   // enabling cors
    origin: 'https://id-ocr-script-preet.netlify.app',  //
    credentials: true,
    optionsSuccessStatus: 200
}));

const storage=multer.diskStorage({       // configuring disk storage for multer
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix=`${Date.now()}-${Math.round(Math.random()*1E9)}`;       // creating a unique file name
        cb(null, `${file.fieldname}-${uniqueSuffix}`);
    }
});

const upload=multer({ storage });      // creating a multer instance for handling file uploads

const adharToText=(text) => {         // function to extract data from Aadhar card OCR text

    const idType="ADHAR CARD";
    const idNumber=text.match(/\d{4} \d{4} \d{4}/)? text.match(/\d{4} \d{4} \d{4}/)[0]:null;
    const gender=(text.match(/MALE|FEMALE|Male|Female/)||[null])[0];
    const name=(text.match(/[A-Z][a-z]+\s[A-Z][a-z]+/)||[null])[0];
    const dob=text.match(/Year of Birth/)? (text.match(/:\s(\d{4})/)||[null])[1]:(text.match(/\d{2}\/\d{2}\/\d{4}/)||[null])[0];

    return {
        idType,
        idNumber,
        info: {
            name,
            gender,
            dob
        }
    };
};

const panToText=(text) => {                    // function to extract data from PAN card OCR text

    const idType="PAN CARD";
    const idNumber=(text.match(/[A-Z]{5}\d{4}[A-Z]{1}/g)||[null])[0];
    const dob=(text.match(/\d{2}\/\d{2}\/\d{4}/)||[null])[0];
    const indiaToEnd=text.substring(text.indexOf("INDIA")+5);
    const matches=indiaToEnd.match(/\b[A-Z]+\s(?:\w+\s)?[A-Z]+\b/g);
    const [name, fatherName]=matches? matches:[null, null];

    return {
        idType,
        idNumber,
        info: {
            name,
            dob,
            fatherName
        }
    };
};

const deleteFiles=(files) => {      //removing uploaded file
    files.forEach(file => {
        fs.unlink(file, (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log(`File ${file} deleted successfully!`);
            }
        });
    });
};


//imagetotext route. 
//This route handles POST requests that contain an image file in the picture field. 
//It uses sharp to preprocess the image, then tesseract.js to extract text from the image. 
//The extracted text is parsed using adharToText or panToText, 
//The uploaded image is deleted using deleteFile after processing.
//the structured data is returned to the client. 

app.post('/imagetotext', upload.single('picture'), async (req, res) => {
    try {
        const editedImage="uploads/edited-image.png";
        await sharp(req.file.path)
            .grayscale()
            .sharpen({ sigma: 1, m1: 2, m2: 2 })
            .normalize({ lower: 10, upper: 50 })
            .resize(3000, null, { withoutEnlargement: true })
            .gamma()
            .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
            .toFile(editedImage);

        tesseract.recognize(editedImage, ['eng'])
            .then(({ data: { text } }) => {
                let result;
                const panreg=/\b(?:INCOME|TAX|Permanent)\b/;
                result=panreg.test(text)? panToText(text):adharToText(text);
                res.status(201).json({ result, imageToText: text });
                // deleteFiles([req.file.path, "uploads/edited-image.png"]);
            })
            .catch((error) => {
                res.status(500).json({ message: error.message });
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


//Starting the server on port 3000 and logging a message to the console when the server starts.
try {
    app.listen(3000, () => {
        console.log('App is running on port 3000');
    });
} catch (err) {
    console.error('Error starting server:', err);
}

