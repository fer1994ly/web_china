# Lenguaje ubicuo

Vocabulario unico del proyecto. Si un concepto no esta en esta tabla, no debe aparecer
en nombres de clases, funciones, rutas ni textos de interfaz.

| Termino | Definicion | Tipo tactico |
|---|---|---|
| **Agenda del dia** | Todo lo que ocurre en una fecha: sus slots, sus reservas y sus bloqueos. Es el limite de consistencia del sistema. | Aggregate root |
| **Slot** | Un hueco de 60 minutos en el horario de atencion, identificado por fecha + hora. | Value object (`HoraSlot`) |
| **Estado de slot** | `disponible`, `reservado`, `bloqueado` o `pasado`. Derivado, nunca almacenado. | Value object |
| **Reserva** | Compromiso de un paciente para un slot y una terapia. Nace `confirmada`, puede pasar a `cancelada`. | Entidad |
| **Codigo de reserva** | Identificador corto que el paciente usa para cancelar sin cuenta ni login. Formato `QI-XXXXXX`. | Value object |
| **Bloqueo** | Slot que el centro retira de la venta por un motivo propio (feriado, capacitacion, mantenimiento). | Entidad |
| **Horario de atencion** | Politica que define que tramos existen cada dia de la semana. Genera los slots. | Domain service / policy |
| **Terapia** | Uno de los cuatro servicios del centro, con duracion y precio. | Entidad de catalogo |
| **Paciente** | Quien reserva. No tiene cuenta: se identifica con nombre y celular. | Value object (`DatosPaciente`) |
| **Reloj** | Fuente de tiempo inyectada. El dominio nunca consulta la hora del sistema por su cuenta. | Port |

## Invariantes del dominio

1. **Un slot, una sola reserva confirmada.** Esta es la razon por la que la Agenda del dia
   es el agregado: la colision solo se puede impedir si el dia entero es la unidad de consistencia.
2. **Un slot bloqueado no se puede reservar**, y un slot reservado no se puede bloquear.
3. **No se reserva en el pasado.** Se evalua contra el Reloj inyectado.
4. **No se reserva fuera del horario de atencion.**
5. **Cancelar libera el slot** pero conserva la reserva con estado `cancelada` (historial).

## Decisiones de modelado

- **Grilla fija de 60 minutos.** Las cuatro terapias duran entre 40 y 60 minutos, asi que el
  centro opera con una grilla horaria uniforme. La duracion de cada terapia es informativa para
  el paciente y no fragmenta la agenda. Esto mantiene la invariante 1 como una comparacion de
  igualdad de horas, sin aritmetica de solapamientos.
- **Sin cuentas de usuario.** El paciente se identifica por celular; la cancelacion usa el
  codigo de reserva. Kodarvia agregara autenticacion real.
