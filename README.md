# Convert PPT To PNG Using NextJS

Simple NextJS API to convert any PPT file to PNG directly on server.

## Dependencies

* GraphicMagick

    ```sh
    sudo apt-get install -y graphicsmagick
    ```

* Libreoffice

    ```sh
    sudo apt-get install libreoffice
    ```

* Python3

* Python3-Pip

* NodeJS & NPM


## Installing Unoserver

```sh
pip install unoserver --user
```

or

```sh
python3 -m pip install unoserver
```

> It is best to keep only one version of libreoffice to reduce the complexity. Remove other versions and keep only latest one.


## Installing NodeJS Dependencies

Open terminal in your project directory and run below command:

```sh
npm install
```

## Running The Server

Open terminal in your project directory and run below command:

```sh
npm run dev
```

By default server runs at PORT 3000. Open http://localhost:3000 in your browser.


## File Locations

* **Uploaded files:** Go to `/uploads/` folder.
* **Output files:** Go to `/public/output` folder.