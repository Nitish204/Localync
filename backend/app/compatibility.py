"""
Rule-based compatibility engine for the PC Builder.

Deliberately not a black box: every check below maps to a real constraint
(socket matching, RAM generation, PSU headroom, case clearance). This is
what makes the "Compatibility Score" mean something instead of being a
random number — swap in richer part data and the same checks scale.
"""
from typing import List
from . import models, schemas


def _find(components: List[models.Product], slug: str):
    return next((c for c in components if c.category and c.category.slug == slug), None)


def evaluate_build(components: List[models.Product]) -> schemas.CompatibilityResult:
    checks: List[schemas.CompatibilityCheck] = []

    cpu = _find(components, "cpu")
    mobo = _find(components, "motherboard")
    ram = _find(components, "ram")
    gpu = _find(components, "gpu")
    psu = _find(components, "psu")
    case = _find(components, "case")

    # --- CPU <-> Motherboard socket ---
    if cpu and mobo:
        if cpu.socket and mobo.socket and cpu.socket == mobo.socket:
            checks.append(schemas.CompatibilityCheck(
                label="CPU Socket", status="ok",
                detail=f"{cpu.name} matches the {mobo.socket} socket on {mobo.name}."))
        else:
            checks.append(schemas.CompatibilityCheck(
                label="CPU Socket", status="error",
                detail=f"{cpu.name} ({cpu.socket or 'unknown socket'}) does not fit "
                       f"{mobo.name} ({mobo.socket or 'unknown socket'})."))
    else:
        checks.append(schemas.CompatibilityCheck(
            label="CPU Socket", status="warning", detail="Add a CPU and motherboard to check fit."))

    # --- RAM type + motherboard support ---
    if ram and mobo:
        if ram.ram_type and mobo.ram_type and ram.ram_type == mobo.ram_type:
            checks.append(schemas.CompatibilityCheck(
                label="RAM Type", status="ok",
                detail=f"{ram.ram_type} module supported by {mobo.name}."))
        else:
            checks.append(schemas.CompatibilityCheck(
                label="RAM Type", status="error",
                detail=f"{ram.name} is {ram.ram_type or '?'}, but {mobo.name} takes "
                       f"{mobo.ram_type or '?'}."))
    else:
        checks.append(schemas.CompatibilityCheck(
            label="RAM Type", status="warning", detail="Add RAM and a motherboard to check fit."))

    # --- GPU clearance inside case ---
    if gpu and case:
        if gpu.length_mm and case.max_gpu_length_mm:
            if gpu.length_mm <= case.max_gpu_length_mm:
                checks.append(schemas.CompatibilityCheck(
                    label="GPU Clearance", status="ok",
                    detail=f"{gpu.name} ({gpu.length_mm}mm) fits {case.name} "
                           f"(max {case.max_gpu_length_mm}mm)."))
            else:
                checks.append(schemas.CompatibilityCheck(
                    label="GPU Clearance", status="error",
                    detail=f"{gpu.name} ({gpu.length_mm}mm) is longer than {case.name} "
                           f"allows ({case.max_gpu_length_mm}mm)."))
        else:
            checks.append(schemas.CompatibilityCheck(
                label="GPU Clearance", status="warning", detail="Missing dimension data."))
    else:
        checks.append(schemas.CompatibilityCheck(
            label="GPU Clearance", status="warning", detail="Add a GPU and case to check fit."))

    # --- PSU headroom ---
    total_draw = sum(c.wattage_draw or 0 for c in components if c.wattage_draw)
    # baseline draw for everything else (fans, drives, board) not itemized
    total_draw += 60
    if psu and psu.wattage_supply:
        headroom = psu.wattage_supply - total_draw
        if headroom >= 100:
            checks.append(schemas.CompatibilityCheck(
                label="PSU Headroom", status="ok",
                detail=f"{psu.name} supplies {psu.wattage_supply}W against an estimated "
                       f"{total_draw}W draw — {headroom}W headroom."))
        elif headroom >= 0:
            checks.append(schemas.CompatibilityCheck(
                label="PSU Headroom", status="warning",
                detail=f"Only {headroom}W headroom on {psu.name}. Consider a higher-rated PSU."))
        else:
            checks.append(schemas.CompatibilityCheck(
                label="PSU Headroom", status="error",
                detail=f"{psu.name} ({psu.wattage_supply}W) is undersized for an estimated "
                       f"{total_draw}W draw."))
    else:
        checks.append(schemas.CompatibilityCheck(
            label="PSU Headroom", status="warning", detail="Add a PSU to check power headroom."))

    # --- Form factor: motherboard fits case ---
    if mobo and case:
        compatible_pairs = {
            ("ATX", "ATX"), ("mATX", "ATX"), ("ITX", "ATX"),
            ("mATX", "mATX"), ("ITX", "mATX"), ("ITX", "ITX"),
        }
        if mobo.form_factor and case.form_factor:
            if (mobo.form_factor, case.form_factor) in compatible_pairs:
                checks.append(schemas.CompatibilityCheck(
                    label="Form Factor", status="ok",
                    detail=f"{mobo.form_factor} board fits the {case.form_factor} case."))
            else:
                checks.append(schemas.CompatibilityCheck(
                    label="Form Factor", status="error",
                    detail=f"{mobo.form_factor} board does not fit the {case.form_factor} case."))

    # --- Score: start at 100, deduct per problem ---
    score = 100
    for c in checks:
        if c.status == "error":
            score -= 30
        elif c.status == "warning":
            score -= 8
    score = max(0, min(100, score))

    return schemas.CompatibilityResult(score=score, checks=checks, estimated_wattage=total_draw)
