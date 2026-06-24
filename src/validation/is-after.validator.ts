import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

// Validates that the decorated ISO date string is chronologically after the
// ISO date string held in `property` on the same object.
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAfter",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (typeof value !== "string" || typeof relatedValue !== "string") {
            return false;
          }

          const end = Date.parse(value);
          const start = Date.parse(relatedValue);

          if (Number.isNaN(end) || Number.isNaN(start)) {
            return false;
          }

          return end > start;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be after ${relatedPropertyName}`;
        },
      },
    });
  };
}
