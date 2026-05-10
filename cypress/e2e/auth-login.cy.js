const API_BASE_URL = "http://localhost:3000/api";

const TEST_USER = {
  email: "testuser@example.com",
  password: "Password123#01",
  nombre: "Test User",
};

const ensureTestUserExists = () => {
  cy.request({
    method: "POST",
    url: `${API_BASE_URL}/auth/register`,
    failOnStatusCode: false,
    body: TEST_USER,
  }).then((response) => {
    expect([201, 400]).to.include(response.status);
  });
};

describe("Internal login", () => {
  beforeEach(() => {
    cy.clearCookies();
    ensureTestUserExists();
    cy.visit("/login", {
      onBeforeLoad(win) {
        win.localStorage.clear();
        win.sessionStorage.clear();
      },
    });
  });

  it("shows the internal login form", () => {
    cy.getBySel("login-card").should("be.visible");
    cy.getBySel("login-form").should("be.visible");
    cy.getBySel("email-input").should("be.visible");
    cy.getBySel("password-input").should("be.visible");
    cy.getBySel("login-submit").should("be.visible");
  });

  it("logs in successfully with valid credentials", () => {
    cy.getBySel("email-input").type(TEST_USER.email);
    cy.getBySel("password-input").type(TEST_USER.password);
    cy.getBySel("login-submit").click();

    cy.url().should("include", "/mapa");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("meteomap_token")).to.be.a("string").and.not.be.empty;

      const savedUser = JSON.parse(win.localStorage.getItem("meteomap_user"));
      expect(savedUser.email).to.eq(TEST_USER.email);
      expect(savedUser.nombre || savedUser.name).to.eq(TEST_USER.nombre);
    });
  });

  it("shows an error when the password is incorrect", () => {
    cy.getBySel("email-input").type(TEST_USER.email);
    cy.getBySel("password-input").type("WrongPassword123#");
    cy.getBySel("login-submit").click();

    cy.getBySel("login-error")
      .should("be.visible")
      .and("contain", "Credenciales inválidas");
  });

  it("shows a validation error when the email format is invalid", () => {
    cy.request({
      method: "POST",
      url: `${API_BASE_URL}/auth/login`,
      failOnStatusCode: false,
      body: {
        email: "not-an-email",
        password: TEST_USER.password,
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq("El email debe ser válido");
      expect(response.body.error).to.eq("Validación fallida");
    });
  });

  it("shows a validation error when the password is too short", () => {
    cy.request({
      method: "POST",
      url: `${API_BASE_URL}/auth/login`,
      failOnStatusCode: false,
      body: {
        email: TEST_USER.email,
        password: "abc",
      },
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.eq("La contraseña debe tener al menos 8 caracteres");
      expect(response.body.error).to.eq("Validación fallida");
    });
  });
});