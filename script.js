let map;
let directionsService;
let directionsRenderer;

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: -14.235, lng: -51.925 },
    });

    directionsRenderer.setMap(map);

    const origemInput = document.getElementById("origem");
    const destinoInput = document.getElementById("destino");

    new google.maps.places.Autocomplete(origemInput);
    new google.maps.places.Autocomplete(destinoInput);
}

document.getElementById("calcularBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;
    const tipoCarga = document.getElementById("tipoCarga").value;

    if (!origem || !destino) {
        alert("Por favor, preencha os endereços de partida e chegada.");
        return;
    }

    const request = {
        origin: origem,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            const distanciaMetros = result.routes[0].legs[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            const distanciaTexto = result.routes[0].legs[0].distance.text;

            // Regra de preço por distância:
            // Até 30 km é considerado Urbano (Dentro da cidade) -> R$ 15,00/km
            // Acima de 30 km é considerado Viagem (Entre cidades) -> R$ 7,00/km
            let valorPorKm = distanciaKm <= 30 ? 15.00 : 7.00;
            let tipoRotaTexto = distanciaKm <= 30 ? "Urbano (Dentro da cidade)" : "Intermunicipal / Viagem";

            // Fator multiplicador de acordo com o tipo de carga escolhido
            let multiplicadorCarga = 1.0;
            if (tipoCarga === "pequena") multiplicadorCarga = 0.8; // Desconto leve para cargas leves
            if (tipoCarga === "grande") multiplicadorCarga = 1.3;  // Acréscimo para cargas grandes

            // Cálculo final do valor
            let valorTotal = (distanciaKm * valorPorKm) * multiplicadorCarga;

            // Garantir um valor mínimo de taxa de saída (ex: R$ 30,00)
            if (valorTotal < 30.00) valorTotal = 30.00;

            // Exibe os resultados na tela
            document.getElementById("distancia").innerText = distanciaTexto;
            document.getElementById("tipoRota").innerText = tipoRotaTexto;
            document.getElementById("valorFrete").innerText = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById("resultado").classList.remove("hidden");
        } else {
            alert("Não foi possível calcular a rota. Verifique os endereços informados.");
        }
    });
});

window.onload = initMap;
