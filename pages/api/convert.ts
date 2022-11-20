import { spawn, ChildProcess } from 'child_process';
import type { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from "fs";
import path from "path";
import formidable, { File } from 'formidable';
import pdf2image from '../../utilities/pdf2image';

const convert2image = (filePath, host, callback) => {
    pdf2image.setOptions({
        type: 'png',                                // png or jpg, default jpg
        size: 1024,                                 // default 1024
        density: 600,                               // default 600
        outputdir: 'public/output',                 // output folder, default null (if null given, then it will create folder name same as file name)
        outputname: `${Date.now()}`,                         // output file name, dafault null (if null given, then it will create image name same as input name)
        page: null,                                 // convert selected page, default null (if null given, then it will convert all pages)
        quality: 100                                // jpg compression quality, default: 100
      });
      
      pdf2image.convert(filePath, function(err, info) {
        if (err) console.log(err)
        else {
            console.log(info);

            const data = { ...info };

            data.message = data.message.map((x) => ({
                ...x,
                path: x.path.replace('public/', `http://${host}/`),
            }));

            callback(data);
        }
      });
}

const run = (input: string, output: string, callback): ChildProcess => {
  const stdout: Uint8Array[] = [];
  const stderr: Uint8Array[] = [];

  console.log(`Running command: unoconvert ${input} ${output}`);

  const childProcess:any = spawn('unoconvert', [input, output]);

  childProcess.stdout.on('data', (data: Uint8Array) => {
    stdout.push(data);
  });

  childProcess.stderr.on('data', (data: Uint8Array) => {
    stderr.push(data);
  });

  childProcess.on('close', (code: string) => {
    console.log(`node-unoconv finished with code: ${code}`);

    if (stderr.length) {
      const error = new Error(Buffer.concat(stderr).toString('utf8'));
      console.log(error);
      callback(error);
      return;
    }

    const result = Buffer.concat(stdout);
    callback(null, result);
  });

  childProcess.on('error', (err: Error) => {
    if (err.message.indexOf('ENOENT') > -1) {
      console.log('unoconv command not found. ', err);
      return;
    }

    console.log(err);
  });

  return childProcess;
};

const unoconv = (input: string, output: string, callback?) => {
  if (!callback) {
    // Return a promise if there is no callback
    return new Promise((resolve, reject) => {
      // Assign a fake callback that would either resolve or reject the promise
      const callbackFun = (err, result) => {
        return err
        ? reject(err)
        : resolve(result);
    }

      return run(input, output, callbackFun);
    });
  }

  return run(input, output, callback);
};

/* Don't miss that! */
export const config = {
    api: {
        bodyParser: false,
    }
};

type ProcessedFiles = Array<[string, File]>;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

    let status = 200,
        resultBody = { status: 'ok', message: 'Files were uploaded successfully' };

    /* Get files using formidable */
    const files:any = await new Promise<ProcessedFiles | undefined>((resolve, reject) => {
        const form = new formidable.IncomingForm();
        const files: ProcessedFiles = [];
        form.on('file', function (field, file) {
            files.push([field, file]);
        })
        form.on('end', () => resolve(files));
        form.on('error', err => reject(err));
        form.parse(req, () => {
            //
        });
    }).catch(e => {
        console.log(e);
        status = 500;
        resultBody = {
            status: 'fail', message: 'Upload error'
        }
    });

    if (files?.length) {

        /* Create directory for uploads */
        const targetPath = path.join(process.cwd(), `/uploads/`);
        try {
            await fs.access(targetPath);
        } catch (e) {
            await fs.mkdir(targetPath);
        }

        /* Move uploaded files to directory */
        for (const file of files) {
            const tempPath = file[1].filepath;
            const targetFilePath = targetPath + file[1].originalFilename;

            await fs.rename(tempPath, targetFilePath);

            unoconv(targetFilePath, `${targetFilePath}.pdf`, (_err, result) => {
                console.log(result);
                // res.status(200).json({ result: 'success', message: 'File processed successfully' });

                convert2image(`${targetFilePath}.pdf`, req.headers.host, (data) => {
                    res.status(200).json(data);
                });
            })
        }
    } else {
        res.status(status).json(resultBody);
    }
}

export default handler;