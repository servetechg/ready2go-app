import { z } from 'zod';

export const addressSchema = z.object({
  streetAddress: z.string().min(1, 'Street address is required'),
  aptUnit: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z
    .string()
    .min(1, 'ZIP code is required')
    .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code'),
  useCurrentLocation: z.boolean(),
});

export const householdSchema = z.object({
  householdSize: z.number().min(1, 'At least 1 person required').max(50, 'Maximum 50 people'),
});

const yesNoSchema = (optionsLabel: string) =>
  z
    .object({
      hasRequirement: z
        .union([z.boolean(), z.null()])
        .refine((val): val is boolean => val !== null, {
          message: 'Please select Yes or No',
        }),
      selectedOptions: z.array(z.string()),
      otherDetails: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.hasRequirement && data.selectedOptions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Please select at least one ${optionsLabel}`,
          path: ['selectedOptions'],
        });
      }
    });

export const adaSchema = yesNoSchema('ADA requirement');
export const medicalSchema = yesNoSchema('medical need');
export const petsSchema = yesNoSchema('pet or livestock type');
export const transportSchema = yesNoSchema('transportation limitation');

export const lodgingSchema = z.object({
  selectedOptions: z.array(z.string()).min(1, 'Please select at least one lodging preference'),
  otherDetails: z.string().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
export type HouseholdFormData = z.infer<typeof householdSchema>;
export type YesNoFormData = z.infer<ReturnType<typeof yesNoSchema>>;
export type LodgingFormData = z.infer<typeof lodgingSchema>;
