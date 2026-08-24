// --- Estado ---
const hoy = new Date();
let fechaVista = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // primer día del mes visible
let fechaSeleccionada = new Date(
  hoy.getFullYear(),
  hoy.getMonth(),
  hoy.getDate(),
);

const meses = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// --- Almacenamiento de registros (clave: 'YYYY-MM-DD') ---
const STORAGE_KEY = "diario-registros";

function cargarRegistros() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function guardarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

let registros = cargarRegistros();

function claveFecha(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- Elementos DOM ---
const fechaTexto = document.getElementById("fechaTexto");
const fechaActual = document.getElementById("fechaActual");
const mesActualEl = document.getElementById("mesActual");
const grillaDias = document.getElementById("grillaDias");
const btnMananaSi = document.getElementById("btnMananaSi");
const btnMananaNo = document.getElementById("btnMananaNo");
const btnTardeSi = document.getElementById("btnTardeSi");
const btnTardeNo = document.getElementById("btnTardeNo");
const nota = document.getElementById("nota");
const btnGuardar = document.getElementById("btnGuardar");
const guardadoTexto = document.getElementById("guardadoTexto");
const semanaRango = document.getElementById("semanaRango");
const valorBase = document.getElementById("valorBase");
const btnCalcular = document.getElementById("btnCalcular");
const montoTotal = document.getElementById("montoTotal");

// true, false, o null para cada bloque
let estadoManana = null;
let estadoTarde = null;

// --- Renderizar encabezado de fecha seleccionada ---
function renderFechaActual() {
  const dia = fechaSeleccionada.getDate();
  const mes = meses[fechaSeleccionada.getMonth()];
  const anio = fechaSeleccionada.getFullYear();
  fechaTexto.textContent = `${dia} de ${mes} de ${anio}`;
}

// --- Obtener el lunes de la semana de una fecha dada ---
function obtenerLunesDeLaSemana(fecha) {
  const diaSemana = fecha.getDay(); // 0 = domingo, 1 = lunes, ... 6 = sábado
  // distancia hacia atrás hasta el lunes (si es domingo, retrocede 6 días)
  const distancia = diaSemana === 0 ? 6 : diaSemana - 1;
  const lunes = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate() - distancia,
  );
  return lunes;
}

// --- Valor de un día individual según mañana/tarde-noche ---
function valorDelDia(registro, base) {
  if (!registro) return 0;
  const { manana, tardeNoche } = registro;
  if (manana === true && tardeNoche === true) return base;
  if (manana === false && tardeNoche === false) return 0;
  if (
    (manana === true && tardeNoche === false) ||
    (manana === false && tardeNoche === true)
  )
    return base / 2;
  return 0; // incompleto (algún valor null/undefined)
}

// --- Mostrar el rango de la semana actual (lunes a domingo) ---
function actualizarRangoSemana() {
  const lunes = obtenerLunesDeLaSemana(fechaSeleccionada);
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      lunes.getFullYear(),
      lunes.getMonth(),
      lunes.getDate() + i,
    );
    dias.push(d);
  }
  const primero = dias[0];
  const ultimo = dias[6];
  const mismomMes = primero.getMonth() === ultimo.getMonth();
  const rangoTexto = mismomMes
    ? `Semana: ${primero.getDate()} – ${ultimo.getDate()} de ${meses[primero.getMonth()]}`
    : `Semana: ${primero.getDate()} de ${meses[primero.getMonth()]} – ${ultimo.getDate()} de ${meses[ultimo.getMonth()]}`;
  semanaRango.textContent = rangoTexto;
  montoTotal.textContent = "—";
}

// --- Calcular el total de la semana según el valor base ---
function calcularTotalSemanal() {
  const base = parseFloat(valorBase.value);
  if (isNaN(base) || base <= 0) {
    montoTotal.textContent = "Ingresa un valor válido";
    return;
  }

  const lunes = obtenerLunesDeLaSemana(fechaSeleccionada);
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      lunes.getFullYear(),
      lunes.getMonth(),
      lunes.getDate() + i,
    );
    const clave = claveFecha(d);
    total += valorDelDia(registros[clave], base);
  }

  montoTotal.textContent = "$" + total.toLocaleString("es-CO");
}

// --- Determinar color de la barra según mañana/tarde ---
function colorBarra(registro) {
  if (!registro) return null;
  const { manana, tardeNoche } = registro;
  if (
    manana === null ||
    tardeNoche === null ||
    manana === undefined ||
    tardeNoche === undefined
  )
    return null;
  if (manana === true && tardeNoche === true) return "verde";
  if (manana === false && tardeNoche === false) return "roja";
  return "amarilla"; // una sí y otra no, en cualquier orden
}

// --- Renderizar calendario del mes visible ---
function renderCalendario() {
  mesActualEl.textContent = `${meses[fechaVista.getMonth()]} ${fechaVista.getFullYear()}`;
  grillaDias.innerHTML = "";

  const primerDiaSemana = new Date(
    fechaVista.getFullYear(),
    fechaVista.getMonth(),
    1,
  ).getDay();
  const diasEnMes = new Date(
    fechaVista.getFullYear(),
    fechaVista.getMonth() + 1,
    0,
  ).getDate();

  // celdas vacías antes del día 1
  for (let i = 0; i < primerDiaSemana; i++) {
    const vacio = document.createElement("div");
    vacio.className = "dia-celda";
    const espacio = document.createElement("div");
    espacio.className = "dia vacio";
    vacio.appendChild(espacio);
    grillaDias.appendChild(vacio);
  }

  // días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const contenedor = document.createElement("div");
    contenedor.className = "dia-celda";

    const celda = document.createElement("div");
    celda.className = "dia";
    celda.textContent = dia;

    const fechaCelda = new Date(
      fechaVista.getFullYear(),
      fechaVista.getMonth(),
      dia,
    );
    const clave = claveFecha(fechaCelda);

    if (
      fechaCelda.getFullYear() === fechaSeleccionada.getFullYear() &&
      fechaCelda.getMonth() === fechaSeleccionada.getMonth() &&
      fechaCelda.getDate() === fechaSeleccionada.getDate()
    ) {
      celda.classList.add("seleccionado");
    }

    celda.addEventListener("click", () => {
      fechaSeleccionada = fechaCelda;
      renderFechaActual();
      renderCalendario();
      cargarRegistroDelDia();
      actualizarRangoSemana();
    });

    const barra = document.createElement("div");
    barra.className = "barra-registro";
    const color = colorBarra(registros[clave]);
    if (color) barra.classList.add(color);

    contenedor.appendChild(celda);
    contenedor.appendChild(barra);
    grillaDias.appendChild(contenedor);
  }
}

// --- Navegación entre meses ---
document.getElementById("mesAnterior").addEventListener("click", () => {
  fechaVista = new Date(fechaVista.getFullYear(), fechaVista.getMonth() - 1, 1);
  renderCalendario();
});

document.getElementById("mesSiguiente").addEventListener("click", () => {
  fechaVista = new Date(fechaVista.getFullYear(), fechaVista.getMonth() + 1, 1);
  renderCalendario();
});

// --- Cargar registro del día seleccionado en el formulario ---
function cargarRegistroDelDia() {
  const clave = claveFecha(fechaSeleccionada);
  const registro = registros[clave];

  estadoManana = registro ? (registro.manana ?? null) : null;
  estadoTarde = registro ? (registro.tardeNoche ?? null) : null;
  nota.value = registro ? registro.nota || "" : "";
  guardadoTexto.textContent = "";

  actualizarBotones();
}

function actualizarBotones() {
  btnMananaSi.classList.toggle("activo", estadoManana === true);
  btnMananaNo.classList.toggle("activo", estadoManana === false);
  btnTardeSi.classList.toggle("activo", estadoTarde === true);
  btnTardeNo.classList.toggle("activo", estadoTarde === false);
}

// --- Guardar registro del día (botón explícito) ---
function guardarRegistroDelDia() {
  const clave = claveFecha(fechaSeleccionada);

  if (
    estadoManana === null &&
    estadoTarde === null &&
    nota.value.trim() === ""
  ) {
    delete registros[clave];
  } else {
    registros[clave] = {
      manana: estadoManana,
      tardeNoche: estadoTarde,
      nota: nota.value,
    };
  }

  guardarRegistros(registros);
  renderCalendario();

  guardadoTexto.textContent = "Guardado";
  setTimeout(() => (guardadoTexto.textContent = ""), 1500);
}

btnMananaSi.addEventListener("click", () => {
  estadoManana = estadoManana === true ? null : true;
  actualizarBotones();
});

btnMananaNo.addEventListener("click", () => {
  estadoManana = estadoManana === false ? null : false;
  actualizarBotones();
});

btnTardeSi.addEventListener("click", () => {
  estadoTarde = estadoTarde === true ? null : true;
  actualizarBotones();
});

btnTardeNo.addEventListener("click", () => {
  estadoTarde = estadoTarde === false ? null : false;
  actualizarBotones();
});

btnGuardar.addEventListener("click", guardarRegistroDelDia);
btnCalcular.addEventListener("click", calcularTotalSemanal);

// --- Colapsar/expandir calendario al hacer clic en la fecha actual ---
let calendarioVisible = true;
fechaActual.addEventListener("click", () => {
  calendarioVisible = !calendarioVisible;
  fechaActual.classList.toggle("abierto", calendarioVisible);
  document
    .querySelectorAll(".calendario-header, .dias-semana, #grillaDias")
    .forEach((el) => {
      el.style.display = calendarioVisible ? "" : "none";
    });
});

// --- Inicializar ---
fechaActual.classList.add("abierto");
renderFechaActual();
renderCalendario();
cargarRegistroDelDia();
actualizarRangoSemana();
