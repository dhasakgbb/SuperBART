# Enemy and Hazard Matrix

## Enemies
- Walker: patrol + wall turn, stomp kill, side-hit damage.
- Shell: stomp retract, second stomp kick shell, safety window before side damage.
- Flying: sine-wave movement, stomp kill.
- Spitter: fixed-position shooter with projectile cadence.

## Hazards
- Spike: immediate damage on overlap.
- Thwomp-lite: proximity-triggered drop and return cycle.
- Moving platform system with pits and springboard recovery interaction.

## Interaction Policies
- Stomp precedence when player body is descending and above enemy top.
- Side collision damages player unless invulnerability active.
- Fast shell movement can eliminate other enemies with bounded behavior.
