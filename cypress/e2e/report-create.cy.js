const API_BASE_URL = "http://localhost:3000/api";

const TEST_USER = {
  email: "testuser@example.com",
  password: "Password123#01",
  nombre: "Test User",
};

const TEST_ZONE = {
  _id: "64b64c9f8f8f8f8f8f8f8f8f",
  nombre: "Parque Nacional de Ordesa y Monte Perdido",
  geolocalizacion: { coordinates: [0.05, 42.67] },
  cache_meteo: {
    current: {
      datos_crudos: {
        temperatura: 2,
        velocidad_viento: 18,
        descripcion: "Nieve ligera",
      },
    },
  },
};

const TEST_CATEGORY = {
  _id: "64b64c9f8f8f8f8f8f8f90",
  nombre: "Nieve",
  icono_marcador: "snowflake",
};

describe("Create report flow", () => {
  beforeEach(() => {
    cy.request({
      method: "POST",
      url: `${API_BASE_URL}/auth/register`,
      failOnStatusCode: false,
      body: TEST_USER,
    });

    cy.request({
      method: "POST",
      url: `${API_BASE_URL}/auth/login`,
      body: {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    }).then(({ body }) => {
      cy.intercept("GET", "**/api/zones", {
        statusCode: 200,
        body: { data: [TEST_ZONE] },
      }).as("getZones");

      cy.intercept("GET", "**/api/zones/search*", (req) => {
        req.reply({
          statusCode: 200,
          body: { data: [TEST_ZONE] },
        });
      }).as("searchZones");

      cy.intercept("GET", "**/categories", {
        statusCode: 200,
        body: [TEST_CATEGORY],
      }).as("getCategories");

      cy.intercept("GET", "**/api/zones/*/forecast", {
        statusCode: 200,
        body: { data: { datos_crudos: [] } },
      }).as("getForecast");

      cy.intercept("GET", "**/api/zones/*/weather", {
        statusCode: 200,
        body: { data: { datos_meteorologicos: {} } },
      }).as("getWeather");

      cy.intercept("GET", "**/api/reports?zonaId=*", {
        statusCode: 200,
        body: { reports: [] },
      }).as("getReportsByZone");

      cy.intercept("GET", "**/api/comments/zone/*", {
        statusCode: 200,
        body: { comments: [] },
      }).as("getCommentsByZone");

      cy.intercept("POST", "**/reports", (req) => {
        expect(req.headers.authorization).to.eq(`Bearer ${body.token}`);
        expect(req.body).to.deep.equal({
          zona_id: TEST_ZONE._id,
          categoria_id: TEST_CATEGORY._id,
          descripcion: "Nieve ligera y viento moderado en la parte alta.",
        });

        req.reply({
          statusCode: 201,
          body: {
            message: "Reporte creado exitosamente",
            report: {
              _id: "74b64c9f8f8f8f8f8f8f91",
            },
          },
        });
      }).as("createReport");

      cy.visit("/mapa", {
        onBeforeLoad(win) {
          win.localStorage.setItem("meteomap_token", body.token);
          win.localStorage.setItem(
            "meteomap_user",
            JSON.stringify({
              id: TEST_USER.email,
              email: TEST_USER.email,
              nombre: TEST_USER.nombre,
            })
          );
          win.sessionStorage.clear();
        },
      });
    });
  });

  it("creates a report for a selected zone", () => {
    cy.wait("@getZones");

    cy.getBySel("zone-search-input").type("Ordesa");
    cy.wait("@searchZones");

    cy.getBySel("zone-search-result").should("be.visible").first().click();
    cy.contains("h2", TEST_ZONE.nombre).should("be.visible");

    cy.getBySel("create-report-button").should("be.visible").click();
    cy.wait("@getCategories");

    cy.getBySel("create-report-modal").should("be.visible");

    cy.getBySel("risk-type-trigger").click();
    cy.getBySel("risk-type-option").contains(TEST_CATEGORY.nombre).click();

    cy.get('textarea#description').type('Nieve ligera y viento moderado en la parte alta.');
    cy.getBySel('publish-report-button').click();

    cy.wait("@createReport");
    cy.contains('¡Reporte publicado con éxito!').should('be.visible');
    cy.getBySel('create-report-modal').should('not.exist');
  });
});