

const formulario = document.querySelector("form");
const nombreInput = document.querySelector("#nombre");
const tipoInput = document.querySelector("#tipo");
const listaComidas = document.querySelector("ul");

// ============================================
// DÍAS DE LA SEMANA
// ============================================

const dias = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

// ============================================
// GUARDAR LAS COMIDAS
// ============================================

let comidas = [];


// ============================================
// AGREGAR UNA COMIDA
// ============================================

formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const nombre = nombreInput.value.trim();
    const tipo = tipoInput.value;

    if (nombre === "") {
        alert("Escribe el nombre de la comida.");
        return;
    }

    const nuevaComida = {
        nombre: nombre,
        tipo: tipo
    };

    comidas.push(nuevaComida);

    mostrarComidas();

    nombreInput.value = "";
});


// ============================================
// MOSTRAR LAS COMIDAS
// ============================================

function mostrarComidas() {

    listaComidas.innerHTML = "";

    comidas.forEach(function (comida) {

        const elemento = document.createElement("li");

        let emoji = "🍽️";

        if (comida.tipo === "desayuno") {
            emoji = "🌅";
        }

        if (comida.tipo === "almuerzo") {
            emoji = "☀️";
        }

        if (comida.tipo === "cena") {
            emoji = "🌙";
        }

        elemento.textContent =
            `${emoji} ${comida.nombre} — ${comida.tipo}`;

        listaComidas.appendChild(elemento);
    });
}


// ============================================
// MEZCLAR LAS COMIDAS
// ============================================

function mezclar(array) {

    const copia = [...array];

    for (let i = copia.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}


// ============================================
// OBTENER COMIDAS POR TIPO
// ============================================

function obtenerComidas(tipo) {

    return comidas.filter(function (comida) {
        return comida.tipo === tipo;
    });
}



function generarMenu() {

    const desayunos = mezclar(obtenerComidas("desayuno"));
    const almuerzos = mezclar(obtenerComidas("almuerzo"));
    const cenas = mezclar(obtenerComidas("cena"));


    // Comprobar que haya comidas de cada tipo

    if (desayunos.length === 0) {
        alert("Agrega al menos un desayuno.");
        return;
    }

    if (almuerzos.length === 0) {
        alert("Agrega al menos un almuerzo.");
        return;
    }

    if (cenas.length === 0) {
        alert("Agrega al menos una cena.");
        return;
    }


    const diasHTML = document.querySelectorAll(
        "section:last-child article"
    );


    // Crear copias de las listas
    // para poder ir sacando las comidas utilizadas

    let listaDesayunos = [...desayunos];
    let listaAlmuerzos = [...almuerzos];
    let listaCenas = [...cenas];


    dias.forEach(function (dia, indice) {

        // Si ya no quedan comidas disponibles,
        // volvemos a llenar la lista y la mezclamos.

        if (listaDesayunos.length === 0) {
            listaDesayunos = mezclar(desayunos);
        }

        if (listaAlmuerzos.length === 0) {
            listaAlmuerzos = mezclar(almuerzos);
        }

        if (listaCenas.length === 0) {
            listaCenas = mezclar(cenas);
        }


        // Sacar una comida de cada lista

        const desayuno = listaDesayunos.shift();

        const almuerzo = listaAlmuerzos.shift();

        const cena = listaCenas.shift();


        // Mostrar el resultado

        const articulo = diasHTML[indice];

        articulo.innerHTML = `
            <h3>${dia}</h3>

            <p>🌅 Desayuno: ${desayuno.nombre}</p>

            <p>☀️ Almuerzo: ${almuerzo.nombre}</p>

            <p>🌙 Cena: ${cena.nombre}</p>
        `;

    });

}



// ============================================
// BOTÓN PARA GENERAR EL MENÚ
// ============================================

const botonMenu = document.createElement("button");

botonMenu.textContent = "✨ Generar menú semanal";

botonMenu.type = "button";

botonMenu.addEventListener("click", generarMenu);


// ============================================
// COLOCAR EL BOTÓN EN LA PÁGINA
// ============================================

const secciones = document.querySelectorAll("section");

const ultimaSeccion = secciones[secciones.length - 1];

ultimaSeccion.insertBefore(
    botonMenu,
    ultimaSeccion.children[1]
);

